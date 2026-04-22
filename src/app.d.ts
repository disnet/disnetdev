/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Locals {
      auth: {
        did: string;
        isAuthor: boolean;
      } | null;
    }

    interface Platform {
      env?: {
        KV?: KVNamespace;
      };
    }
  }
}

export {};
