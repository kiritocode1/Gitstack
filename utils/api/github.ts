/**
 * GitHub API interaction functions
 * 
 * Supports authenticated requests via GitHub token stored in extension storage.
 * Authenticated requests have a 5,000/hour rate limit vs 60/hour unauthenticated.
 */

import { CACHE_TTL } from '../cache';

// In-memory cache for repository tree
const treeCache = new Map<string, { paths: string[]; timestamp: number }>();

// Cached token to avoid repeated storage lookups
let cachedToken: string | null = null;
let tokenChecked = false;

// Listen for storage changes (when popup saves/removes token)
try {
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.githubToken) {
            cachedToken = (changes.githubToken.newValue as string) ?? null;
            tokenChecked = true;
            console.log('[GitStack] Token updated from storage:', cachedToken ? 'set' : 'removed');
        }
    });
} catch (e) {
    // Storage listener not available (e.g., in non-extension context)
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
 * Get GitHub token from extension storage
 */
async function getGitHubToken(): Promise<string | null> {
    if (tokenChecked) return cachedToken;

    try {
        // Try to get token from extension storage
        const result = await browser.storage.sync.get('githubToken') as { githubToken?: string };
        cachedToken = result.githubToken ?? null;
        tokenChecked = true;

        if (cachedToken) {
            console.log('[GitStack] Using authenticated GitHub API requests');
        }

        return cachedToken;
    } catch (e) {
        console.warn('[GitStack] Could not access extension storage:', e);
        tokenChecked = true;
        return null;
    }
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
async function githubFetch(url: string): Promise<Response> {
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

/**
 * Fetch user's public repositories
 */
export async function fetchUserRepos(username: string): Promise<RepoInfo[]> {
    const repos: RepoInfo[] = [];
    let page = 1;
    const maxPages = 3;

    try {
        while (page <= maxPages) {
            const res = await githubFetch(
                `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`
            );
            checkRateLimit(res);

            if (!res.ok) {
                if (res.status === 403) {
                    console.warn('[GitStack] Rate limited on user repos!');
                }
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
    }

    return repos;
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
 * Set GitHub token (called from popup settings)
 */
export async function setGitHubToken(token: string | null): Promise<void> {
    try {
        if (token) {
            await browser.storage.sync.set({ githubToken: token });
            cachedToken = token;
        } else {
            await browser.storage.sync.remove('githubToken');
            cachedToken = null;
        }
        tokenChecked = true;
        console.log('[GitStack] GitHub token updated');
    } catch (e) {
        console.warn('[GitStack] Could not save token:', e);
    }
}

/**
 * Check if a token is configured
 */
export async function hasGitHubToken(): Promise<boolean> {
    const token = await getGitHubToken();
    return token !== null && token.length > 0;
}
