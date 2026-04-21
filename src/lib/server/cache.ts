type CacheEntry<T> = {
  value: T;
  expiresAt?: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs?: number) {
  store.set(key, {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : undefined
  });
}

export function deleteCache(key: string) {
  store.delete(key);
}

export function invalidateCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function clearCache() {
  store.clear();
}
