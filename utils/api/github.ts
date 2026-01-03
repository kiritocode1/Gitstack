/**
 * GitHub API interaction functions
 */

import { CACHE_TTL } from '../cache';

// In-memory cache for repository tree
const treeCache = new Map<string, { paths: string[]; timestamp: number }>();

export interface RepoInfo {
    name: string;
    owner: { login: string };
    full_name: string;
    default_branch: string;
    stargazers_count: number;
    pushed_at: string;
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
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoRes.ok) {
            console.warn('[GitStack] Failed to fetch repo info, falling back to shallow scan');
            return [];
        }
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';

        // Fetch the full tree recursively
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
        );

        if (!treeRes.ok) {
            // Check if rate limited
            const remaining = treeRes.headers.get('X-RateLimit-Remaining');
            if (remaining === '0') {
                console.warn('[GitStack] GitHub API rate limit reached, falling back to shallow scan');
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
            const res = await fetch(
                `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`
            );
            if (!res.ok) break;
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
 * Fetch raw file content from a repository
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
