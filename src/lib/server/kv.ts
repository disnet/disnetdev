import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Redis } from '@upstash/redis';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<void>;
  del(key: string): Promise<void>;
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

let store: KeyValueStore | undefined;

function createUpstashStore(): KeyValueStore | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const redis = new Redis({ url, token });

  return {
    async get<T>(key: string) {
      const value = await redis.get<string>(key);
      if (!value) return undefined;
      return JSON.parse(value) as T;
    },

    async set<T>(key: string, value: T, options?: { ttlSeconds?: number }) {
      if (options?.ttlSeconds) {
        await redis.set(key, JSON.stringify(value), { ex: options.ttlSeconds });
        return;
      }

      await redis.set(key, JSON.stringify(value));
    },

    async del(key: string) {
      await redis.del(key);
    }
  };
}

export function getKeyValueStore(): KeyValueStore {
  if (store) return store;

  const upstashStore = createUpstashStore();
  store = upstashStore ?? undefined;

  if (!store) {
    if (!dev) {
      console.warn(
        'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured; falling back to in-memory key-value storage.'
      );
    }

    store = inMemoryKeyValueStore;
  }

  return store;
}
