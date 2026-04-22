// Use satori/standalone, not satori — the main entry eagerly runs yoga-layout's
// emscripten loader at import time (top-level `await loadYoga()`), which tries
// to compile wasm from bytes and is forbidden on Cloudflare. The standalone
// variant defers that until we call init().
import satori, { init as satoriInit } from 'satori/standalone';
import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm';
import { buildOgTree, type OgInputs, OG_WIDTH, OG_HEIGHT } from './template';

// Cloudflare Workers disallow compile-from-bytes at every stage, so we rely on
// Wrangler's bundler to pre-compile these imports into WebAssembly.Module
// bindings. The `og-wasm-external` plugin in vite.config.ts keeps these
// imports external through the SSR bundle so they survive for Wrangler to see.
// We use dynamic import so Node doesn't try to evaluate the .wasm extension
// during SvelteKit's build-time manifest/prerender pass — the endpoints that
// call into this file are not prerendered.
function loadYogaModule(): Promise<WebAssembly.Module> {
  // @ts-expect-error resolved by Wrangler at upload time
  return import('./wasm/yoga.wasm').then((m) => m.default);
}
function loadResvgModule(): Promise<WebAssembly.Module> {
  // @ts-expect-error resolved by Wrangler at upload time
  return import('./wasm/resvg.wasm').then((m) => m.default);
}

type FontSpec = {
  name: string;
  path: string;
  weight: number;
  style: 'normal' | 'italic';
};

const FONT_SPECS: FontSpec[] = [
  { name: 'Young Serif', path: '/og-fonts/young-serif-regular.ttf', weight: 400, style: 'normal' },
  { name: 'Alegreya', path: '/og-fonts/alegreya-regular.ttf', weight: 400, style: 'normal' },
  { name: 'Alegreya', path: '/og-fonts/alegreya-italic.ttf', weight: 400, style: 'italic' },
  { name: 'Alegreya Sans SC', path: '/og-fonts/alegreya-sans-sc-medium.ttf', weight: 500, style: 'normal' },
  { name: 'Commit Mono', path: '/og-fonts/commit-mono-regular.ttf', weight: 400, style: 'normal' }
];

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: 'normal' | 'italic';
};

let satoriReady: Promise<void> | null = null;
let resvgReady: Promise<void> | null = null;
let fontsCache: Promise<LoadedFont[]> | null = null;

function isAlreadyInitialized(err: unknown) {
  return err instanceof Error && /already initialized/i.test(err.message);
}

function ensureSatori() {
  if (!satoriReady) {
    satoriReady = loadYogaModule()
      .then(async (mod) => {
        try {
          await satoriInit(mod);
        } catch (err) {
          if (!isAlreadyInitialized(err)) throw err;
        }
      })
      .catch((err) => {
        satoriReady = null;
        throw err;
      });
  }
  return satoriReady;
}

function ensureResvg() {
  if (!resvgReady) {
    resvgReady = loadResvgModule()
      .then(async (mod) => {
        try {
          await initResvg(mod);
        } catch (err) {
          if (!isAlreadyInitialized(err)) throw err;
        }
      })
      .catch((err) => {
        resvgReady = null;
        throw err;
      });
  }
  return resvgReady;
}

async function fetchBytes(origin: string, fetcher: typeof fetch, path: string) {
  const res = await fetcher(new URL(path, origin));
  if (!res.ok) throw new Error(`og: failed to load ${path}: ${res.status}`);
  return res.arrayBuffer();
}

function ensureFonts(origin: string, fetcher: typeof fetch) {
  if (!fontsCache) {
    fontsCache = Promise.all(
      FONT_SPECS.map(async (spec) => ({
        name: spec.name,
        data: await fetchBytes(origin, fetcher, spec.path),
        weight: spec.weight,
        style: spec.style
      }))
    ).catch((err) => {
      fontsCache = null;
      throw err;
    });
  }
  return fontsCache;
}

export async function renderOgImage(
  input: OgInputs,
  { origin, fetch: fetcher }: { origin: string; fetch: typeof fetch }
): Promise<Response> {
  const [, , fonts] = await Promise.all([
    ensureSatori(),
    ensureResvg(),
    ensureFonts(origin, fetcher)
  ]);

  const tree = buildOgTree(input);
  const svg = await satori(tree as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight as 400 | 500,
      style: f.style
    }))
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
    font: { loadSystemFonts: false }
  });
  const png = resvg.render().asPng();
  const body = png.buffer.slice(
    png.byteOffset,
    png.byteOffset + png.byteLength
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'
    }
  });
}

export { OG_WIDTH, OG_HEIGHT };
