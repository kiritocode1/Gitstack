/**
 * LocalStorage cache utilities
 */

export const CACHE_TTL = {
    REPO: 10 * 60 * 1000,      // 10 minutes
    TREE: 5 * 60 * 1000,       // 5 minutes
    PROFILE: 30 * 60 * 1000,   // 30 minutes
} as const;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export function getCache<T>(key: string, ttl: number): T | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp }: CacheEntry<T> = JSON.parse(cached);
        if (Date.now() - timestamp > ttl) return null;

        return data;
    } catch {
        return null;
    }
}

export function setCache<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        console.warn('[GitStack] Cache write error', e);
    }
}

export function getCacheWithTimestamp<T>(key: string): { data: T; timestamp: number } | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        return JSON.parse(cached);
    } catch {
        return null;
    }
}
