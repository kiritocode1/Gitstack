/**
 * Logo fetching from SVGL API and local signatures
 */

import { signatures } from '../signatures';

// Cache for SVGL results to avoid rate limits
const logoCache = new Map<string, string | null>();

/**
 * Fetch logo from SVGL or local signatures
 */
export async function fetchLogo(techName: string, isDark: boolean): Promise<string | null> {
    const cacheKey = `${techName}-${isDark ? 'dark' : 'light'}`;
    if (logoCache.has(cacheKey)) return logoCache.get(cacheKey) || null;

    // 1. Check local signatures first
    const localSig = signatures.find(s => s.name === techName);
    if (localSig?.logo) {
        let url: string | undefined;
        if (typeof localSig.logo === 'string') {
            url = localSig.logo;
        } else {
            url = isDark ? localSig.logo.dark : localSig.logo.light;
        }

        if (url) {
            logoCache.set(cacheKey, url);
            return url;
        }
    }

    // 2. Fallback to API if not defined in signatures.ts
    try {
        const res = await fetch(`https://api.svgl.app?search=${encodeURIComponent(techName)}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            // Find exact match first, then fallback
            const match = data.find((item: any) => item.title.toLowerCase() === techName.toLowerCase()) || data[0];

            let url = match.route;
            if (typeof url === 'object') {
                url = isDark ? (url.dark || url.light) : (url.light || url.dark);
            }

            logoCache.set(cacheKey, url);
            return url;
        }
    } catch (e) {
        console.warn('Failed to fetch logo for', techName, e);
    }

    logoCache.set(cacheKey, null); // Cache miss to prevent retry
    return null;
}

/**
 * Fetch tech details from SVGL API
 */
export async function fetchTechDetails(techName: string): Promise<{ websiteUrl: string; category: string } | null> {
    try {
        const res = await fetch(`https://api.svgl.app?search=${encodeURIComponent(techName)}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
            const match = data.find((item: any) => item.title.toLowerCase() === techName.toLowerCase()) || data[0];
            return {
                websiteUrl: match.url,
                category: Array.isArray(match.category) ? match.category.join(', ') : match.category,
            };
        }
    } catch (e) {
        console.warn('Failed to fetch tech details for', techName, e);
    }

    return null;
}
