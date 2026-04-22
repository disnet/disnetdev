declare global {
  namespace App {
    interface Locals {
      auth: {
        did: string;
        isAuthor: boolean;
      } | null;
    }
  }
}

export {};
