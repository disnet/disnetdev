declare global {
  namespace App {
    interface Locals {
      auth: {
        sessionId: string;
        did: string;
        isAuthor: boolean;
      } | null;
    }
  }
}

export {};
