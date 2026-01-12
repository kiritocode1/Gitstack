/**
 * Profile page scanning logic
 */

import { signatures } from '../signatures';
import { fetchUserRepos, RepoInfo, githubFetch, fetchRawFile } from '../api/github';
import { CACHE_TTL, getCacheWithTimestamp, setCache } from '../cache';
import {
    injectProfileLoadingState,
    removeProfileLoadingState,
    injectProfileEmptyState,
    injectProfileSidebar,
    injectProfileRateLimitError,
} from './ui';

// Track usernames we've already scanned to prevent infinite loops
const scannedProfileUsernames = new Set<string>();

// Reserved GitHub paths that are NOT user profiles
const PROFILE_RESERVED_PATHS = [
    'explore', 'topics', 'trending', 'collections', 'events',
    'sponsors', 'about', 'pricing', 'features', 'enterprise',
    'team', 'security', 'customer-stories', 'readme', 'new',
    'organizations', 'settings', 'notifications', 'pulls', 'issues',
    'marketplace', 'apps', 'codespaces', 'discussions', 'orgs', 'users',
    'search', 'login', 'signup', 'join', 'stars', 'watching', 'repositories'
];

/**
 * Check if current page is a profile page
 */
export function isProfilePageCheck(): boolean {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length !== 1) return false;
    const username = parts[0];
    if (PROFILE_RESERVED_PATHS.includes(username.toLowerCase())) return false;
    if (username.startsWith('.') || username.includes('?')) return false;
    return true;
}

/**
 * Get the username from profile page URL
 */
export function getProfileUsername(): string | null {
    if (!isProfilePageCheck()) return null;
    return location.pathname.split('/').filter(Boolean)[0];
}

interface PinnedItem {
    type: 'repo' | 'gist';
    owner: string;
    name: string;
    fullName: string;
    gistId?: string;
}

/**
 * Scrape pinned items (repositories AND gists) from the profile page DOM
 * These are the items the user has explicitly chosen to showcase
 */
function getPinnedItemsFromDOM(): PinnedItem[] {
    const pinnedItems: PinnedItem[] = [];
    const seenIds = new Set<string>();

    // Try to find all pinned item containers
    const pinnedContainers = document.querySelectorAll('.pinned-item-list-item, [class*="pinned-item"]');

    pinnedContainers.forEach(container => {
        // Look for repository links
        const repoLink = container.querySelector('a[href^="/"][data-hovercard-type="repository"], a.repo, a.text-bold[href^="/"]');
        if (repoLink) {
            const href = repoLink.getAttribute('href');
            if (href && !href.includes('gist.github.com')) {
                const parts = href.split('/').filter(Boolean);
                if (parts.length >= 2 && !seenIds.has(href)) {
                    seenIds.add(href);
                    pinnedItems.push({
                        type: 'repo',
                        owner: parts[0],
                        name: parts[1],
                        fullName: `${parts[0]}/${parts[1]}`
                    });
                }
            }
        }

        // Look for gist links (they link to gist.github.com or have gist hovercard)
        const gistLink = container.querySelector('a[href*="gist.github.com"], a[data-hovercard-type="gist"]');
        if (gistLink) {
            const href = gistLink.getAttribute('href');
            if (href) {
                // Gist URLs: https://gist.github.com/username/gist_id or /username/gist_id
                const gistMatch = href.match(/gist\.github\.com\/([^\/]+)\/([a-f0-9]+)/i) ||
                    href.match(/^\/([^\/]+)\/([a-f0-9]{20,})/i);
                if (gistMatch && !seenIds.has(gistMatch[2])) {
                    seenIds.add(gistMatch[2]);
                    pinnedItems.push({
                        type: 'gist',
                        owner: gistMatch[1],
                        name: gistMatch[2],
                        fullName: `gist:${gistMatch[1]}/${gistMatch[2]}`,
                        gistId: gistMatch[2]
                    });
                }
            }
        }
    });

    // Fallback: try old selectors for repos if we found nothing
    if (pinnedItems.length === 0) {
        const selectors = [
            '.pinned-item-list-item-content .repo',
            '.js-pinned-items-reorder-list a[data-hovercard-type="repository"]',
            '.pinned-item-list-item a.text-bold'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(el => {
                    const href = el.getAttribute('href');
                    if (href && !href.includes('gist')) {
                        const parts = href.split('/').filter(Boolean);
                        if (parts.length >= 2 && !seenIds.has(href)) {
                            seenIds.add(href);
                            pinnedItems.push({
                                type: 'repo',
                                owner: parts[0],
                                name: parts[1],
                                fullName: `${parts[0]}/${parts[1]}`
                            });
                        }
                    }
                });
                break;
            }
        }
    }

    const repos = pinnedItems.filter(p => p.type === 'repo');
    const gists = pinnedItems.filter(p => p.type === 'gist');
    console.log(`[GitStack] Found ${repos.length} pinned repos and ${gists.length} pinned gists from DOM`);

    return pinnedItems;
}

/**
 * Extract imported packages from code content based on language
 */
function extractImportsFromCode(content: string, fileName: string): string[] {
    const imports: string[] = [];
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // JavaScript/TypeScript imports
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'mts', 'cts'].includes(ext)) {
        // ESM: import ... from 'package' or import 'package'
        const esmImports = content.matchAll(/import\s+(?:(?:\{[^}]*\}|[\w*]+|\*\s+as\s+\w+)\s+from\s+)?['"]([^'"]+)['"]/g);
        for (const match of esmImports) {
            const pkg = match[1];
            // Extract package name (handle scoped packages like @org/pkg)
            if (pkg.startsWith('.') || pkg.startsWith('/')) continue; // Skip relative imports
            const pkgName = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
            imports.push(pkgName);
        }

        // CJS: require('package')
        const cjsImports = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
        for (const match of cjsImports) {
            const pkg = match[1];
            if (pkg.startsWith('.') || pkg.startsWith('/')) continue;
            const pkgName = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
            imports.push(pkgName);
        }
    }

    // Python imports
    if (['py', 'pyw', 'pyi'].includes(ext)) {
        // import package or import package.submodule
        const pyImports = content.matchAll(/^import\s+(\w+)/gm);
        for (const match of pyImports) {
            imports.push(match[1]);
        }

        // from package import ...
        const pyFromImports = content.matchAll(/^from\s+(\w+)/gm);
        for (const match of pyFromImports) {
            imports.push(match[1]);
        }
    }

    // Go imports
    if (ext === 'go') {
        // import "package" or import ( "package1" "package2" )
        const goImports = content.matchAll(/["']([^"']+)["']/g);
        // Look for imports after 'import' keyword
        const importSection = content.match(/import\s*\(([^)]+)\)/s) || content.match(/import\s+"([^"]+)"/);
        if (importSection) {
            const importContent = importSection[1] || importSection[0];
            const pkgs = importContent.matchAll(/["']([^"']+)["']/g);
            for (const match of pkgs) {
                const pkg = match[1];
                // Extract last part of Go import path
                const parts = pkg.split('/');
                imports.push(parts[parts.length - 1]);
                // Also add full path for matching
                if (pkg.includes('github.com')) {
                    imports.push(parts.slice(0, 3).join('/'));
                }
            }
        }
    }

    // Rust imports
    if (ext === 'rs') {
        // use crate_name::...
        const rustUse = content.matchAll(/use\s+(\w+)::/g);
        for (const match of rustUse) {
            if (!['crate', 'self', 'super', 'std', 'core', 'alloc'].includes(match[1])) {
                imports.push(match[1]);
            }
        }

        // extern crate crate_name
        const rustExtern = content.matchAll(/extern\s+crate\s+(\w+)/g);
        for (const match of rustExtern) {
            imports.push(match[1]);
        }
    }

    // Ruby imports
    if (['rb', 'rake', 'gemspec'].includes(ext)) {
        // require 'gem_name' or require "gem_name"
        const rubyRequires = content.matchAll(/require\s+['"]([^'"]+)['"]/g);
        for (const match of rubyRequires) {
            const pkg = match[1];
            if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
                imports.push(pkg.split('/')[0]);
            }
        }
    }

    return [...new Set(imports)]; // Deduplicate
}

/**
 * Scan a gist for technologies based on file extensions AND file content imports
 */
async function scanGist(gistId: string): Promise<{ techs: string[]; rateLimited: boolean }> {
    const cacheKey = `gitstack-gist-${gistId}`;

    const cached = getCacheWithTimestamp<{ techs: string[] }>(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.PROFILE) {
        return { techs: cached.data.techs || [], rateLimited: false };
    }

    try {
        // Fetch gist with file content from GitHub API
        const gistRes = await githubFetch(`https://api.github.com/gists/${gistId}`);

        if (gistRes.status === 403) {
            const remaining = gistRes.headers.get('X-RateLimit-Remaining');
            if (remaining === '0') {
                console.warn('[GitStack] Rate limited during gist scan');
                return { techs: [], rateLimited: true };
            }
        }

        if (!gistRes.ok) return { techs: [], rateLimited: false };

        const gistData = await gistRes.json();
        const detectedSet = new Set<string>();
        const files = gistData.files || {};
        const fileNames = Object.keys(files);

        // 1. Match file extensions against signatures
        signatures.forEach(sig => {
            if (sig.extensions?.some(ext => fileNames.some(f => f.endsWith(ext)))) {
                detectedSet.add(sig.name);
            }
            // Also check exact filename matches
            if (sig.files?.some(f => fileNames.some(gf => gf === f || gf.endsWith(f)))) {
                detectedSet.add(sig.name);
            }
        });

        // 2. Parse file contents for imports
        const allImports: string[] = [];
        for (const fileName of fileNames) {
            const file = files[fileName];
            if (file.content && file.size < 100000) { // Only parse files < 100KB
                const imports = extractImportsFromCode(file.content, fileName);
                allImports.push(...imports);
            }
        }

        // 3. Match imports against packageJSONDependencies in signatures
        const uniqueImports = [...new Set(allImports)];
        signatures.forEach(sig => {
            if (sig.packageJSONDependencies?.some(dep => uniqueImports.includes(dep))) {
                detectedSet.add(sig.name);
            }
        });

        console.log(`[GitStack] Gist ${gistId}: found imports:`, uniqueImports);

        const techsArray = Array.from(detectedSet);
        console.log(`[GitStack] Detected ${techsArray.length} techs from gist ${gistId}:`, techsArray);

        setCache(cacheKey, { techs: techsArray });

        return { techs: techsArray, rateLimited: false };
    } catch (e) {
        console.warn('[GitStack] Gist scan failed for', gistId, e);
        return { techs: [], rateLimited: false };
    }
}

/**
 * Parse package.json and detect technologies from dependencies
 */
async function parsePackageJsonDeps(owner: string, repo: string): Promise<string[]> {
    const detectedFromPkg: string[] = [];

    try {
        const packageJsonContent = await fetchRawFile(owner, repo, 'package.json');
        if (!packageJsonContent) return detectedFromPkg;

        const pkg = JSON.parse(packageJsonContent);
        const allDeps: Record<string, string> = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies,
            ...pkg.optionalDependencies,
        };

        const depNames = Object.keys(allDeps);

        signatures.forEach(sig => {
            if (sig.packageJSONDependencies?.some(dep => depNames.includes(dep))) {
                detectedFromPkg.push(sig.name);
            }
        });

        console.log(`[GitStack] Detected ${detectedFromPkg.length} techs from package.json in ${owner}/${repo}`);
    } catch (e) {
        // package.json doesn't exist or isn't valid JSON
    }

    return detectedFromPkg;
}

/**
 * Get repos that don't have valid cache
 */
function getUncachedRepos(repos: RepoInfo[]): RepoInfo[] {
    return repos.filter(repo => {
        const cacheKey = `gitstack-cache-${repo.owner.login}-${repo.name}`;
        const cached = getCacheWithTimestamp<{ techs: string[] }>(cacheKey);
        if (!cached) return true;
        return Date.now() - cached.timestamp > CACHE_TTL.PROFILE;
    });
}

/**
 * Aggregate tech stack from cached repo data
 */
function aggregateFromCache(repos: RepoInfo[]): { techs: string[]; cachedCount: number } {
    const allTechs = new Set<string>();
    let cachedCount = 0;

    repos.forEach(repo => {
        const cacheKey = `gitstack-cache-${repo.owner.login}-${repo.name}`;
        const cached = getCacheWithTimestamp<{ techs: string[] }>(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL.PROFILE) {
            cached.data.techs?.forEach((t: string) => allTechs.add(t));
            cachedCount++;
        }
    });

    return { techs: Array.from(allTechs), cachedCount };
}

interface ScanResult {
    techs: string[];
    rateLimited: boolean;
}

/**
 * Quick scan a single repository (file tree + package.json)
 */
async function scanRepoQuick(repo: RepoInfo): Promise<ScanResult> {
    const cacheKey = `gitstack-cache-${repo.owner.login}-${repo.name}`;

    const cached = getCacheWithTimestamp<{ techs: string[] }>(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.PROFILE) {
        return { techs: cached.data.techs || [], rateLimited: false };
    }

    try {
        const treeRes = await githubFetch(
            `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`
        );

        // Check for rate limit
        if (treeRes.status === 403) {
            const remaining = treeRes.headers.get('X-RateLimit-Remaining');
            if (remaining === '0') {
                console.warn('[GitStack] Rate limited during repo scan');
                return { techs: [], rateLimited: true };
            }
        }

        if (!treeRes.ok) return { techs: [], rateLimited: false };

        const treeData = await treeRes.json();
        const paths: string[] = treeData.tree?.map((item: any) => item.path) || [];

        const detectedSet = new Set<string>();

        // 1. Detect from file tree (files and extensions)
        signatures.forEach(sig => {
            if (sig.files?.some(f => paths.some(p => p.endsWith(f) || p === f))) {
                detectedSet.add(sig.name);
            }
            if (sig.extensions?.some(ext => paths.some(p => p.endsWith(ext)))) {
                detectedSet.add(sig.name);
            }
        });

        // 2. Detect from package.json dependencies (if exists)
        const hasPackageJson = paths.some(p => p === 'package.json' || p.endsWith('/package.json'));
        if (hasPackageJson) {
            const pkgTechs = await parsePackageJsonDeps(repo.owner.login, repo.name);
            pkgTechs.forEach(t => detectedSet.add(t));
        }

        const techsArray = Array.from(detectedSet);

        setCache(cacheKey, { techs: techsArray });

        return { techs: techsArray, rateLimited: false };
    } catch (e) {
        console.warn('[GitStack] Quick scan failed for', repo.full_name, e);
        return { techs: [], rateLimited: false };
    }
}

/**
 * Main function to scan and display profile tech stack
 */
export async function scanAndDisplayProfile(username: string): Promise<void> {
    const profileCacheKey = `gitstack-profile-${username}`;

    // Check cache first
    const cached = getCacheWithTimestamp<{ techs: string[]; repoCount: number }>(profileCacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.PROFILE && cached.data.techs?.length > 0) {
        console.log('[GitStack] Using cached profile data for', username);
        injectProfileSidebar(cached.data.techs, cached.data.repoCount, username, false, async () => { });
        return;
    }

    injectProfileLoadingState(username);
    scannedProfileUsernames.add(username);

    const { repos, rateLimited, error } = await fetchUserRepos(username);

    // Handle rate limit
    if (rateLimited) {
        injectProfileRateLimitError(username);
        return;
    }

    // Handle API error vs genuinely no repos
    if (repos.length === 0) {
        removeProfileLoadingState();
        if (error) {
            injectProfileEmptyState(username, 0, 'api_error');
        } else {
            injectProfileEmptyState(username, 0, 'no_repos');
        }
        return;
    }

    const { techs: cachedTechs, cachedCount } = aggregateFromCache(repos);

    if (cachedTechs.length > 0) {
        removeProfileLoadingState();
        injectProfileSidebar(cachedTechs, cachedCount, username, true, async () => {
            await scanMoreRepos(username, repos, cachedTechs, cachedCount);
        });
    }

    // NEW: Prioritize pinned items (repos AND gists) + recent 5 repos
    const pinnedItems = getPinnedItemsFromDOM();
    const pinnedRepos = pinnedItems.filter(p => p.type === 'repo');
    const pinnedGists = pinnedItems.filter(p => p.type === 'gist');
    const uncached = getUncachedRepos(repos);

    // Sort remaining uncached by most recently pushed
    const byRecent = [...uncached].sort((a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    );
    const topRecent = byRecent.slice(0, 5);

    // Build scan list: pinned repos first, then recent (deduplicated)
    const toScanSet = new Set<string>();
    const toScan: RepoInfo[] = [];

    // Add pinned repos first (highest priority - user's curated showcase)
    pinnedRepos.forEach(pinned => {
        if (!toScanSet.has(pinned.fullName)) {
            // Find the full RepoInfo from the fetched repos
            const repoInfo = repos.find(r => r.full_name === pinned.fullName);
            if (repoInfo && getUncachedRepos([repoInfo]).length > 0) {
                toScanSet.add(pinned.fullName);
                toScan.push(repoInfo);
            }
        }
    });

    // Then add recent repos (skip if already in pinned)
    topRecent.forEach(repo => {
        if (!toScanSet.has(repo.full_name)) {
            toScanSet.add(repo.full_name);
            toScan.push(repo);
        }
    });

    console.log(`[GitStack] Scanning: ${pinnedRepos.length} pinned repos, ${pinnedGists.length} pinned gists, ${toScan.length} total repos`);

    // First, scan pinned gists (they're quick and user-curated)
    const gistTechs = new Set<string>(cachedTechs);
    for (const gist of pinnedGists) {
        if (gist.gistId) {
            const { techs, rateLimited } = await scanGist(gist.gistId);
            if (rateLimited) {
                injectProfileRateLimitError(username);
                return;
            }
            techs.forEach(t => gistTechs.add(t));
        }
    }

    if (toScan.length > 0) {
        console.log(`[GitStack] Quick scanning ${toScan.length} uncached repos`);

        // Start with gistTechs which includes cachedTechs + any techs from pinned gists
        const newTechs = new Set<string>(gistTechs);
        let scannedCount = cachedCount;

        for (const repo of toScan) {
            const { techs, rateLimited } = await scanRepoQuick(repo);

            // Show rate limit error if we hit the limit
            if (rateLimited) {
                injectProfileRateLimitError(username);
                return;
            }

            techs.forEach(t => newTechs.add(t));
            scannedCount++;

            removeProfileLoadingState();
            injectProfileSidebar(Array.from(newTechs), scannedCount, username, uncached.length > toScan.length, async () => {
                await scanMoreRepos(username, repos, Array.from(newTechs), scannedCount);
            });

            await new Promise(r => setTimeout(r, 300));
        }

        setCache(profileCacheKey, {
            techs: Array.from(newTechs),
            repoCount: scannedCount
        });

        if (newTechs.size === 0) {
            injectProfileEmptyState(username, scannedCount, 'scanned_nothing');
        }
    } else if (gistTechs.size > 0) {
        // No repos to scan, but we have techs from gists
        removeProfileLoadingState();
        injectProfileSidebar(Array.from(gistTechs), pinnedGists.length, username, false, async () => { });

        setCache(profileCacheKey, {
            techs: Array.from(gistTechs),
            repoCount: pinnedGists.length
        });
    } else if (cachedTechs.length === 0) {
        removeProfileLoadingState();
        if (repos.length > 0) {
            injectProfileEmptyState(username, 0, 'scanned_nothing');
        }
    }
}

/**
 * Scan more repositories when user clicks the button
 */
async function scanMoreRepos(
    username: string,
    repos: RepoInfo[],
    currentTechs: string[],
    currentCount: number
): Promise<void> {
    const uncached = getUncachedRepos(repos);
    const toScan = uncached.slice(0, 10);

    const techSet = new Set(currentTechs);
    let count = currentCount;

    for (const repo of toScan) {
        const { techs, rateLimited } = await scanRepoQuick(repo);

        if (rateLimited) {
            injectProfileRateLimitError(username);
            return;
        }

        techs.forEach(t => techSet.add(t));
        count++;
        await new Promise(r => setTimeout(r, 300));
    }

    injectProfileSidebar(Array.from(techSet), count, username, uncached.length > toScan.length, async () => {
        await scanMoreRepos(username, repos, Array.from(techSet), count);
    });
}

/**
 * Initialize profile scanner on page load
 */
function initProfileScanner(): void {
    const username = getProfileUsername();
    if (username && !scannedProfileUsernames.has(username)) {
        console.log('[GitStack] Detected profile page for:', username);
        setTimeout(() => scanAndDisplayProfile(username), 500);
    }
}

/**
 * Start the profile feature with navigation observer
 */
export function startProfileFeature(): void {
    let lastProfilePath = window.location.pathname;

    const profileObserver = new MutationObserver(() => {
        const currentPath = window.location.pathname;

        if (currentPath !== lastProfilePath) {
            lastProfilePath = currentPath;

            if (isProfilePageCheck()) {
                const username = getProfileUsername();
                if (username && !scannedProfileUsernames.has(username)) {
                    setTimeout(() => scanAndDisplayProfile(username), 500);
                }
            }
        }
    });

    profileObserver.observe(document.body, { childList: true, subtree: true });

    setTimeout(initProfileScanner, 1000);
}
