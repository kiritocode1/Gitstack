/**
 * GitHub API interaction functions
 * 
 * Supports authenticated requests via GitHub token stored in extension storage.
 * Authenticated requests have a 5,000/hour rate limit vs 60/hour unauthenticated.
 * 
 * Token storage is resilient with fallbacks:
 * 1. browser.storage.sync (primary - syncs across devices)
 * 2. browser.storage.local (fallback - local only)
 * 3. localStorage (fallback - works in content scripts)
 * 4. Memory (last resort - session only)
 */

import { CACHE_TTL } from '../cache';

// Storage keys
const TOKEN_KEY = 'githubToken';
const TOKEN_LS_KEY = 'gitstack-github-token';

// In-memory cache for repository tree
const treeCache = new Map<string, { paths: string[]; timestamp: number }>();

// Cached token to avoid repeated storage lookups
let cachedToken: string | null = null;
let tokenChecked = false;
let storageAvailable = true;

// Listen for storage changes (when popup saves/removes token)
try {
    browser.storage.onChanged.addListener((changes, areaName) => {
        if ((areaName === 'sync' || areaName === 'local') && changes[TOKEN_KEY]) {
            cachedToken = (changes[TOKEN_KEY].newValue as string) ?? null;
            tokenChecked = true;
            console.log('[GitStack] Token updated from storage:', cachedToken ? 'set' : 'removed');
        }
    });
} catch (e) {
    // Storage listener not available (e.g., in non-extension context)
    storageAvailable = false;
}

export interface RepoInfo {
    name: string;
    owner: { login: string };
    full_name: string;
    default_branch: string;
    stargazers_count: number;
    pushed_at: string;
}

/**
 * Try to get token from extension storage with retry
 */
async function tryExtensionStorage(retries = 2): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
        try {
            // Try sync storage first (syncs across devices)
            const syncResult = await browser.storage.sync.get(TOKEN_KEY) as { [key: string]: string };
            if (syncResult[TOKEN_KEY]) {
                return syncResult[TOKEN_KEY];
            }

            // Try local storage
            const localResult = await browser.storage.local.get(TOKEN_KEY) as { [key: string]: string };
            if (localResult[TOKEN_KEY]) {
                return localResult[TOKEN_KEY];
            }

            return null;
        } catch (e) {
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 100 * (i + 1)));
            }
        }
    }
    return null;
}

/**
 * Try to get token from localStorage (works in content scripts)
 */
function tryLocalStorage(): string | null {
    try {
        const token = localStorage.getItem(TOKEN_LS_KEY);
        return token || null;
    } catch {
        return null;
    }
}

/**
 * Get GitHub token from storage with fallback chain
 */
async function getGitHubToken(): Promise<string | null> {
    // Return cached if we've already checked
    if (tokenChecked && cachedToken) return cachedToken;

    // 1. Try extension storage (with retry)
    if (storageAvailable) {
        const extToken = await tryExtensionStorage();
        if (extToken) {
            cachedToken = extToken;
            tokenChecked = true;
            console.log('[GitStack] Using authenticated GitHub API requests (from extension storage)');
            return cachedToken;
        }
    }

    // 2. Try localStorage fallback
    const lsToken = tryLocalStorage();
    if (lsToken) {
        cachedToken = lsToken;
        tokenChecked = true;
        console.log('[GitStack] Using authenticated GitHub API requests (from localStorage fallback)');
        return cachedToken;
    }

    // 3. No token found
    tokenChecked = true;
    return null;
}

/**
 * Create fetch options with optional authentication
 */
async function getAuthHeaders(): Promise<HeadersInit> {
    const token = await getGitHubToken();

    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
    }

    return {
        'Accept': 'application/vnd.github+json',
    };
}

/**
 * Authenticated fetch wrapper for GitHub API
 */
export async function githubFetch(url: string): Promise<Response> {
    const headers = await getAuthHeaders();
    return fetch(url, { headers });
}

/**
 * Check if we're rate limited and log helpful info
 */
function checkRateLimit(res: Response): void {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const limit = res.headers.get('X-RateLimit-Limit');
    const reset = res.headers.get('X-RateLimit-Reset');

    if (remaining !== null) {
        console.log(`[GitStack] Rate limit: ${remaining}/${limit}`);

        if (remaining === '0' && reset) {
            const resetTime = new Date(parseInt(reset) * 1000);
            console.warn(`[GitStack] Rate limit exceeded! Resets at ${resetTime.toLocaleTimeString()}`);
            console.info('[GitStack] 💡 Add a GitHub token in extension settings for 5,000 requests/hour');
        }
    }
}

/**
 * Fetch the full repository tree using GitHub API
 */
export async function fetchRepoTree(owner: string, repo: string): Promise<string[]> {
    const cacheKey = `${owner}/${repo}`;
    const cached = treeCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL.TREE) {
        console.log('[GitStack] Using cached tree for', cacheKey);
        return cached.paths;
    }

    try {
        // Try to get the default branch first
        const repoRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`);
        checkRateLimit(repoRes);

        if (!repoRes.ok) {
            if (repoRes.status === 403) {
                console.warn('[GitStack] Rate limited! Falling back to shallow scan');
            } else {
                console.warn('[GitStack] Failed to fetch repo info, falling back to shallow scan');
            }
            return [];
        }
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';

        // Fetch the full tree recursively
        const treeRes = await githubFetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
        );
        checkRateLimit(treeRes);

        if (!treeRes.ok) {
            if (treeRes.status === 403) {
                console.warn('[GitStack] Rate limited on tree fetch!');
            }
            return [];
        }

        const treeData = await treeRes.json();

        if (treeData.truncated) {
            console.warn('[GitStack] Tree was truncated (large repo), some files may be missed');
        }

        // Extract all file paths
        const paths: string[] = treeData.tree
            .filter((item: any) => item.type === 'blob' || item.type === 'tree')
            .map((item: any) => item.path);

        // Cache the result
        treeCache.set(cacheKey, { paths, timestamp: Date.now() });
        console.log(`[GitStack] Fetched ${paths.length} paths from repo tree`);

        return paths;
    } catch (error) {
        console.warn('[GitStack] Error fetching tree:', error);
        return [];
    }
}

export interface FetchReposResult {
    repos: RepoInfo[];
    rateLimited: boolean;
    error: boolean;
}

/**
 * Fetch user's public repositories
 */
export async function fetchUserRepos(username: string): Promise<FetchReposResult> {
    const repos: RepoInfo[] = [];
    let page = 1;
    const maxPages = 3;
    let rateLimited = false;
    let error = false;

    try {
        while (page <= maxPages) {
            const res = await githubFetch(
                `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`
            );
            checkRateLimit(res);

            if (!res.ok) {
                if (res.status === 403) {
                    const remaining = res.headers.get('X-RateLimit-Remaining');
                    if (remaining === '0') {
                        console.warn('[GitStack] Rate limited on user repos!');
                        rateLimited = true;
                    }
                }
                error = true;
                break;
            }
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) break;
            repos.push(...data);
            if (data.length < 100) break;
            page++;
        }
    } catch (e) {
        console.warn('[GitStack] Error fetching repos:', e);
        error = true;
    }

    return { repos, rateLimited, error: error && repos.length === 0 };
}

/**
 * Fetch raw file content from a repository (uses raw.githubusercontent.com, no auth needed)
 */
export async function fetchRawFile(
    owner: string,
    repo: string,
    filePath: string
): Promise<string | null> {
    try {
        const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${filePath}`;
        const res = await fetch(fileUrl);
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
}

/**
 * Set GitHub token with fallback storage layers
 * Returns status: 'success' | 'partial' | 'memory_only' | 'failed'
 */
export async function setGitHubToken(token: string | null): Promise<{
    success: boolean;
    status: 'success' | 'partial' | 'memory_only' | 'failed';
    message: string;
}> {
    let syncSuccess = false;
    let localSuccess = false;
    let lsSuccess = false;

    // Always update memory cache first
    cachedToken = token;
    tokenChecked = true;

    if (token) {
        // Try sync storage (best - syncs across devices)
        try {
            await browser.storage.sync.set({ [TOKEN_KEY]: token });
            syncSuccess = true;
        } catch (e) {
            console.warn('[GitStack] Sync storage failed:', e);
        }

        // Try local storage (extension-only fallback)
        try {
            await browser.storage.local.set({ [TOKEN_KEY]: token });
            localSuccess = true;
        } catch (e) {
            console.warn('[GitStack] Local storage failed:', e);
        }

        // Try localStorage (works in content scripts)
        try {
            localStorage.setItem(TOKEN_LS_KEY, token);
            lsSuccess = true;
        } catch (e) {
            console.warn('[GitStack] localStorage failed:', e);
        }
    } else {
        // Remove token from all storage layers
        try {
            await browser.storage.sync.remove(TOKEN_KEY);
            syncSuccess = true;
        } catch { }

        try {
            await browser.storage.local.remove(TOKEN_KEY);
            localSuccess = true;
        } catch { }

        try {
            localStorage.removeItem(TOKEN_LS_KEY);
            lsSuccess = true;
        } catch { }
    }

    // Determine status
    if (syncSuccess || localSuccess) {
        console.log('[GitStack] Token saved to extension storage');
        return {
            success: true,
            status: 'success',
            message: 'Token saved successfully'
        };
    } else if (lsSuccess) {
        console.log('[GitStack] Token saved to localStorage only (extension storage unavailable)');
        return {
            success: true,
            status: 'partial',
            message: 'Token saved (may not sync across devices)'
        };
    } else if (token) {
        // Only memory worked
        console.log('[GitStack] Token stored in memory only (all storage failed)');
        return {
            success: true,
            status: 'memory_only',
            message: 'Token active for this session only'
        };
    } else {
        return {
            success: true,
            status: 'success',
            message: 'Token removed'
        };
    }
}

/**
 * Check if a token is configured
 */
export async function hasGitHubToken(): Promise<boolean> {
    const token = await getGitHubToken();
    return token !== null && token.length > 0;
}

/**
 * Validate token by making a test API call
 */
export async function validateGitHubToken(token: string): Promise<{
    valid: boolean;
    scopes: string[];
    rateLimit: number;
    error?: string;
}> {
    try {
        const res = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
            }
        });

        if (res.ok) {
            const scopes = res.headers.get('X-OAuth-Scopes')?.split(', ') || [];
            const rateLimit = parseInt(res.headers.get('X-RateLimit-Limit') || '5000', 10);
            return { valid: true, scopes, rateLimit };
        } else if (res.status === 401) {
            return { valid: false, scopes: [], rateLimit: 0, error: 'Invalid token' };
        } else {
            return { valid: false, scopes: [], rateLimit: 0, error: `API error: ${res.status}` };
        }
    } catch (e) {
        return { valid: false, scopes: [], rateLimit: 0, error: 'Network error' };
    }
}

/**
 * Clear token from all storage layers
 */
export async function clearGitHubToken(): Promise<void> {
    cachedToken = null;
    tokenChecked = true;

    try { await browser.storage.sync.remove(TOKEN_KEY); } catch { }
    try { await browser.storage.local.remove(TOKEN_KEY); } catch { }
    try { localStorage.removeItem(TOKEN_LS_KEY); } catch { }

    console.log('[GitStack] Token cleared from all storage');
}
