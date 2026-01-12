/**
 * Robust IndexedDB cache with intelligent fallback and retry logic
 * 
 * Features:
 * - IndexedDB primary storage with localStorage fallback
 * - Automatic retry on transient failures
 * - Stale-while-revalidate pattern
 * - Cache validation and integrity checks
 * - Graceful degradation
 */

export const CACHE_TTL = {
    REPO: 10 * 60 * 1000,      // 10 minutes
    TREE: 5 * 60 * 1000,       // 5 minutes
    PROFILE: 30 * 60 * 1000,   // 30 minutes
    STALE: 24 * 60 * 60 * 1000, // 24 hours - max age for stale data
} as const;

const DB_NAME = 'gitstack-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';
const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // ms

interface CacheEntry<T> {
    key: string;
    data: T;
    timestamp: number;
    version?: number; // For cache invalidation
}

// Cache state
let dbPromise: Promise<IDBDatabase> | null = null;
let dbAvailable = true; // Track if IndexedDB is working
let inMemoryCache = new Map<string, CacheEntry<unknown>>(); // Emergency fallback

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Open (or create) the IndexedDB database with retry logic
 */
async function openDB(): Promise<IDBDatabase> {
    if (!dbAvailable) {
        throw new Error('IndexedDB not available');
    }

    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.warn('[GitStack] IndexedDB open error, marking as unavailable');
                dbAvailable = false;
                dbPromise = null;
                reject(request.error);
            };

            request.onsuccess = () => {
                dbAvailable = true;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        } catch (e) {
            dbAvailable = false;
            reject(e);
        }
    });

    return dbPromise;
}

/**
 * Validate cache entry - check if data looks valid
 */
function isValidCacheEntry<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
    if (!entry) return false;
    if (typeof entry.timestamp !== 'number') return false;
    if (entry.data === undefined || entry.data === null) return false;
    return true;
}

/**
 * Check if cache entry is fresh (within TTL)
 */
function isFresh(entry: CacheEntry<unknown>, ttl: number): boolean {
    return Date.now() - entry.timestamp < ttl;
}

/**
 * Check if cache entry is stale but still usable
 */
function isUsableStale(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp < CACHE_TTL.STALE;
}

/**
 * Get from IndexedDB with retry logic
 */
async function getFromIndexedDB<T>(key: string, retries = MAX_RETRIES): Promise<CacheEntry<T> | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const db = await openDB();

            return new Promise((resolve) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    const entry = request.result as CacheEntry<T> | undefined;
                    resolve(isValidCacheEntry(entry) ? entry : null);
                };

                request.onerror = () => {
                    resolve(null);
                };
            });
        } catch (e) {
            if (attempt < retries - 1) {
                await sleep(RETRY_DELAY * (attempt + 1));
            }
        }
    }
    return null;
}

/**
 * Get from localStorage
 */
function getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        const entry = JSON.parse(cached) as CacheEntry<T>;
        return isValidCacheEntry(entry) ? entry : null;
    } catch {
        return null;
    }
}

/**
 * Get from in-memory cache (last resort)
 */
function getFromMemory<T>(key: string): CacheEntry<T> | null {
    const entry = inMemoryCache.get(key) as CacheEntry<T> | undefined;
    return isValidCacheEntry(entry) ? entry : null;
}

/**
 * Robust cache get with multiple fallback layers
 * Returns: { data, timestamp, isStale }
 */
export async function getCacheRobust<T>(key: string, ttl: number): Promise<{
    data: T | null;
    timestamp: number | null;
    isStale: boolean;
    source: 'indexeddb' | 'localstorage' | 'memory' | 'none';
}> {
    // Try IndexedDB first
    let entry = await getFromIndexedDB<T>(key);
    let source: 'indexeddb' | 'localstorage' | 'memory' | 'none' = 'indexeddb';

    // Fallback to localStorage
    if (!entry) {
        entry = getFromLocalStorage<T>(key);
        source = 'localstorage';
    }

    // Fallback to in-memory
    if (!entry) {
        entry = getFromMemory<T>(key);
        source = 'memory';
    }

    if (!entry) {
        return { data: null, timestamp: null, isStale: false, source: 'none' };
    }

    const isStale = !isFresh(entry, ttl);

    // If stale but too old, don't use it
    if (isStale && !isUsableStale(entry)) {
        return { data: null, timestamp: null, isStale: true, source: 'none' };
    }

    return {
        data: entry.data,
        timestamp: entry.timestamp,
        isStale,
        source
    };
}

/**
 * Set cache in all available stores
 */
export async function setCacheRobust<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        version: 1
    };

    // Always set in memory (instant fallback)
    inMemoryCache.set(key, entry);

    // Set in localStorage (sync fallback)
    try {
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        console.warn('[GitStack] localStorage write failed:', e);
    }

    // Set in IndexedDB (async, best storage)
    try {
        const db = await openDB();

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(entry);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.warn('[GitStack] IndexedDB write failed');
                resolve();
            };
        });
    } catch {
        // Already saved to localStorage and memory
    }
}

/**
 * Invalidate a cache entry (force refresh on next read)
 */
export async function invalidateCache(key: string): Promise<void> {
    inMemoryCache.delete(key);

    try {
        localStorage.removeItem(key);
    } catch { }

    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key);
    } catch { }
}

/**
 * Invalidate all cache entries matching a pattern
 */
export async function invalidateCachePattern(pattern: string | RegExp): Promise<number> {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    // Clear from memory
    for (const key of inMemoryCache.keys()) {
        if (regex.test(key)) {
            inMemoryCache.delete(key);
            count++;
        }
    }

    // Clear from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => {
        try { localStorage.removeItem(key); } catch { }
    });

    // Clear from IndexedDB
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise<void>((resolve) => {
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    if (regex.test(cursor.key as string)) {
                        cursor.delete();
                        count++;
                    }
                    cursor.continue();
                }
            };
            transaction.oncomplete = () => resolve();
        });
    } catch { }

    if (count > 0) {
        console.log(`[GitStack] Invalidated ${count} cache entries matching ${pattern}`);
    }

    return count;
}

/**
 * Invalidate all cache entries for a specific user/profile
 */
export async function invalidateUserCache(username: string): Promise<number> {
    return invalidateCachePattern(new RegExp(`gitstack-.*${username}`, 'i'));
}

/**
 * Force mark entry as stale (will trigger revalidation but data still usable)
 */
export async function markAsStale(key: string): Promise<void> {
    const result = await getCacheRobust<unknown>(key, Infinity);
    if (result.data !== null) {
        const entry: CacheEntry<unknown> = {
            key,
            data: result.data,
            timestamp: Date.now() - CACHE_TTL.STALE + 60000, // Almost expired
            version: 1
        };

        inMemoryCache.set(key, entry);
        try { localStorage.setItem(key, JSON.stringify(entry)); } catch { }
    }
}

/**
 * Invalidate entries older than specified age
 */
export async function invalidateOlderThan(maxAge: number): Promise<number> {
    const cutoff = Date.now() - maxAge;
    let count = 0;

    for (const [key, entry] of inMemoryCache.entries()) {
        if (entry.timestamp < cutoff) {
            inMemoryCache.delete(key);
            count++;
        }
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('gitstack-')) {
            const entry = getFromLocalStorage<unknown>(key);
            if (entry && entry.timestamp < cutoff) {
                keysToRemove.push(key);
            }
        }
    }
    keysToRemove.forEach(key => { try { localStorage.removeItem(key); count++; } catch { } });

    return count;
}

/**
 * Clear ALL cache (nuclear option)
 */
export async function clearAllCache(): Promise<void> {
    inMemoryCache.clear();

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('gitstack-')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => { try { localStorage.removeItem(key); } catch { } });

    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
    } catch { }

    console.log('[GitStack] All cache cleared');
}

/**
 * Get cached data with automatic stale handling
 * If stale, returns stale data AND triggers background refresh via callback
 */
export async function getCacheStaleWhileRevalidate<T>(
    key: string,
    ttl: number,
    revalidate?: () => Promise<T | null>
): Promise<{ data: T | null; wasFresh: boolean }> {
    const result = await getCacheRobust<T>(key, ttl);

    // If we have stale data and a revalidate function, refresh in background
    if (result.isStale && result.data !== null && revalidate) {
        // Fire and forget background refresh
        revalidate().then(async (freshData) => {
            if (freshData !== null) {
                await setCacheRobust(key, freshData);
                console.log(`[GitStack] Background refresh completed for ${key}`);
            }
        }).catch(() => {
            // Revalidation failed, stale data remains
        });
    }

    return {
        data: result.data,
        wasFresh: !result.isStale
    };
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(maxAge: number = CACHE_TTL.STALE): Promise<number> {
    let deletedCount = 0;
    const cutoff = Date.now() - maxAge;

    // Clear from memory
    for (const [key, entry] of inMemoryCache.entries()) {
        if (entry.timestamp < cutoff) {
            inMemoryCache.delete(key);
            deletedCount++;
        }
    }

    // Clear from IndexedDB
    try {
        const db = await openDB();

        await new Promise<void>((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(cutoff);

            const request = index.openCursor(range);

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => resolve();
        });
    } catch { }

    if (deletedCount > 0) {
        console.log(`[GitStack] Cleaned up ${deletedCount} expired cache entries`);
    }

    return deletedCount;
}

// ============== Legacy Sync API (backwards compatible) ==============

export function getCache<T>(key: string, ttl: number): T | null {
    // Try memory first (fastest)
    const memEntry = getFromMemory<T>(key);
    if (memEntry && isFresh(memEntry, ttl)) {
        return memEntry.data;
    }

    // Try localStorage
    const lsEntry = getFromLocalStorage<T>(key);
    if (lsEntry && isFresh(lsEntry, ttl)) {
        // Promote to memory cache
        inMemoryCache.set(key, lsEntry);
        return lsEntry.data;
    }

    // Return stale if usable (better than nothing)
    if (lsEntry && isUsableStale(lsEntry)) {
        console.log(`[GitStack] Using stale cache for ${key} (age: ${Math.round((Date.now() - lsEntry.timestamp) / 60000)}min)`);
        return lsEntry.data;
    }

    return null;
}

export function setCache<T>(key: string, data: T): void {
    // Fire async cache set
    setCacheRobust(key, data).catch(() => { });
}

export function getCacheWithTimestamp<T>(key: string): { data: T; timestamp: number } | null {
    // Try memory first
    let entry = getFromMemory<T>(key);

    // Try localStorage
    if (!entry) {
        entry = getFromLocalStorage<T>(key);
        if (entry) {
            inMemoryCache.set(key, entry);
        }
    }

    if (entry && isUsableStale(entry)) {
        return { data: entry.data, timestamp: entry.timestamp };
    }

    return null;
}

// ============== Initialization ==============

/**
 * Migrate localStorage to IndexedDB
 */
async function migrateToIndexedDB(): Promise<void> {
    try {
        const keysToMigrate: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('gitstack-')) {
                keysToMigrate.push(key);
            }
        }

        for (const key of keysToMigrate) {
            const entry = getFromLocalStorage<unknown>(key);
            if (entry && isUsableStale(entry)) {
                await setCacheRobust(key, entry.data);
            }
        }

        if (keysToMigrate.length > 0) {
            console.log(`[GitStack] Migrated ${keysToMigrate.length} cache entries`);
        }
    } catch { }
}

// Initialize on load
if (typeof indexedDB !== 'undefined') {
    setTimeout(() => {
        migrateToIndexedDB();
        clearExpiredCache();
    }, 3000);
}

// Periodic cleanup (every 10 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        clearExpiredCache();
    }, 10 * 60 * 1000);
}
