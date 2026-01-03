/**
 * Profile page scanning logic
 */

import { signatures } from '../signatures';
import { fetchUserRepos, RepoInfo } from '../api/github';
import { CACHE_TTL, getCacheWithTimestamp, setCache } from '../cache';
import {
    injectProfileLoadingState,
    removeProfileLoadingState,
    injectProfileEmptyState,
    injectProfileSidebar,
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

/**
 * Quick scan a single repository
 */
async function scanRepoQuick(repo: RepoInfo): Promise<string[]> {
    const cacheKey = `gitstack-cache-${repo.owner.login}-${repo.name}`;

    const cached = getCacheWithTimestamp<{ techs: string[] }>(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.PROFILE) {
        return cached.data.techs || [];
    }

    try {
        const treeRes = await fetch(
            `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`
        );
        if (!treeRes.ok) return [];

        const treeData = await treeRes.json();
        const paths: string[] = treeData.tree?.map((item: any) => item.path) || [];

        const detectedSet = new Set<string>();

        signatures.forEach(sig => {
            if (sig.files?.some(f => paths.some(p => p.endsWith(f) || p === f))) {
                detectedSet.add(sig.name);
            }
            if (sig.extensions?.some(ext => paths.some(p => p.endsWith(ext)))) {
                detectedSet.add(sig.name);
            }
        });

        const techsArray = Array.from(detectedSet);

        setCache(cacheKey, { techs: techsArray });

        return techsArray;
    } catch (e) {
        console.warn('[GitStack] Quick scan failed for', repo.full_name, e);
        return [];
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

    const repos = await fetchUserRepos(username);
    if (repos.length === 0) {
        removeProfileLoadingState();
        injectProfileEmptyState(username, 0);
        return;
    }

    const { techs: cachedTechs, cachedCount } = aggregateFromCache(repos);

    if (cachedTechs.length > 0) {
        removeProfileLoadingState();
        injectProfileSidebar(cachedTechs, cachedCount, username, true, async () => {
            await scanMoreRepos(username, repos, cachedTechs, cachedCount);
        });
    }

    const uncached = getUncachedRepos(repos);
    const byStars = [...uncached].sort((a, b) => b.stargazers_count - a.stargazers_count);
    const topStarred = byStars.slice(0, 5);
    const byRecent = [...uncached].sort((a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    );
    const topRecent = byRecent.slice(0, 5);

    const toScanSet = new Set<string>();
    const toScan: RepoInfo[] = [];
    [...topStarred, ...topRecent].forEach(repo => {
        if (!toScanSet.has(repo.full_name)) {
            toScanSet.add(repo.full_name);
            toScan.push(repo);
        }
    });

    if (toScan.length > 0) {
        console.log(`[GitStack] Quick scanning ${toScan.length} uncached repos`);

        const newTechs = new Set<string>(cachedTechs);
        let scannedCount = cachedCount;

        for (const repo of toScan) {
            const techs = await scanRepoQuick(repo);
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
            injectProfileEmptyState(username, scannedCount);
        }
    } else if (cachedTechs.length === 0) {
        removeProfileLoadingState();
        if (repos.length > 0) {
            injectProfileEmptyState(username, 0);
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
        const techs = await scanRepoQuick(repo);
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
