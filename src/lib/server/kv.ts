import { AsyncLocalStorage } from 'node:async_hooks';
import { dev } from '$app/environment';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<void>;
  del(key: string): Promise<void>;
}

// Cloudflare KV enforces a 60s minimum on expirationTtl.
const KV_MIN_TTL_SECONDS = 60;

const platformStorage = new AsyncLocalStorage<App.Platform | undefined>();

export function runWithPlatform<T>(platform: App.Platform | undefined, fn: () => T): T {
  return platformStorage.run(platform, fn);
}

function getPlatform(): App.Platform | undefined {
  return platformStorage.getStore();
}

const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

function cleanupMemoryEntry(key: string) {
  const entry = memoryStore.get(key);
  if (!entry) return;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
  }
}

const inMemoryKeyValueStore: KeyValueStore = {
  async get<T>(key: string) {
    cleanupMemoryEntry(key);
    const entry = memoryStore.get(key);
    if (!entry) return undefined;
    return JSON.parse(entry.value) as T;
  },

  async set<T>(key: string, value: T, options?: { ttlSeconds?: number }) {
    memoryStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined
    });
  },

  async del(key: string) {
    memoryStore.delete(key);
  }
};

function createCloudflareKvStore(kv: KVNamespace): KeyValueStore {
  return {
    async get<T>(key: string) {
      const value = await kv.get(key, { type: 'json' });
      return (value as T | null) ?? undefined;
    },

    async set<T>(key: string, value: T, options?: { ttlSeconds?: number }) {
      const serialized = JSON.stringify(value);
      if (options?.ttlSeconds) {
        const expirationTtl = Math.max(options.ttlSeconds, KV_MIN_TTL_SECONDS);
        await kv.put(key, serialized, { expirationTtl });
        return;
      }
      await kv.put(key, serialized);
    },

    async del(key: string) {
      await kv.delete(key);
    }
  };
}

let warnedAboutFallback = false;

export function getKeyValueStore(): KeyValueStore {
  const kv = getPlatform()?.env?.KV;

  if (kv) {
    return createCloudflareKvStore(kv);
  }

  if (!dev && !warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      'Cloudflare KV binding "KV" is not available on event.platform.env; falling back to in-memory key-value storage.'
    );
  }

  return inMemoryKeyValueStore;
}
