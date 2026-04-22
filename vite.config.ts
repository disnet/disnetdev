import fs from 'node:fs/promises';
import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

// Cloudflare Workers forbid dynamic wasm compilation (from bytes/Response) at
// every stage, including module init. The only way to use wasm there is as an
// ES-module import that Wrangler's bundler pre-compiles into a
// WebAssembly.Module binding. This plugin:
//   1. Keeps `./wasm/*.wasm` imports external (so they survive Vite's SSR bundle
//      as raw import statements rather than being inlined or rewritten to URL
//      fetches).
//   2. Copies the wasm files into the server output so the relative path in the
//      built chunk resolves to a real file when Wrangler re-bundles.
function ogWasmExternal(): Plugin {
  const wasmDir = path.resolve('src/lib/og/wasm');
  return {
    name: 'og-wasm-external',
    apply: 'build',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith('.wasm')) return null;
      if (!importer) return null;
      const abs = path.resolve(path.dirname(importer), source);
      if (!abs.startsWith(wasmDir)) return null;
      // Keep the import relative to the *chunk* location so that the wasm file,
      // which we copy next to the chunks below, resolves at both Wrangler build
      // time and runtime. The chunk that imports it ends up in chunks/, so the
      // relative form `./wasm/<name>` is what we want in the output.
      return { id: `./wasm/${path.basename(abs)}`, external: true };
    },
    async writeBundle(options) {
      const outDir = options.dir;
      // Only copy into the server build output — the client bundle has no use
      // for these and the cloudflare adapter would just shuttle them around.
      if (!outDir || !outDir.endsWith(path.join('output', 'server'))) return;
      const destDir = path.join(outDir, 'chunks', 'wasm');
      await fs.mkdir(destDir, { recursive: true });
      for (const file of await fs.readdir(wasmDir)) {
        if (!file.endsWith('.wasm')) continue;
        await fs.copyFile(path.join(wasmDir, file), path.join(destDir, file));
      }
    }
  };
}

export default defineConfig({
  plugins: [ogWasmExternal(), sveltekit()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});
