import satori, { init as satoriInit } from 'satori';
import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm';
import { buildOgTree, type OgInputs, OG_WIDTH, OG_HEIGHT } from './template';

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

const YOGA_PATH = '/og-wasm/yoga.wasm';
const RESVG_PATH = '/og-wasm/resvg.wasm';

let satoriReady: Promise<void> | null = null;
let resvgReady: Promise<void> | null = null;
let fontsCache: Promise<LoadedFont[]> | null = null;

async function fetchBytes(origin: string, fetcher: typeof fetch, path: string) {
  const res = await fetcher(new URL(path, origin));
  if (!res.ok) throw new Error(`og: failed to load ${path}: ${res.status}`);
  return res.arrayBuffer();
}

function isAlreadyInitialized(err: unknown) {
  return err instanceof Error && /already initialized/i.test(err.message);
}

function ensureSatori(origin: string, fetcher: typeof fetch) {
  if (!satoriReady) {
    satoriReady = (async () => {
      const bytes = await fetchBytes(origin, fetcher, YOGA_PATH);
      try {
        await satoriInit(bytes);
      } catch (err) {
        if (!isAlreadyInitialized(err)) throw err;
      }
    })().catch((err) => {
      satoriReady = null;
      throw err;
    });
  }
  return satoriReady;
}

function ensureResvg(origin: string, fetcher: typeof fetch) {
  if (!resvgReady) {
    resvgReady = (async () => {
      const bytes = await fetchBytes(origin, fetcher, RESVG_PATH);
      try {
        await initResvg(bytes);
      } catch (err) {
        if (!isAlreadyInitialized(err)) throw err;
      }
    })().catch((err) => {
      resvgReady = null;
      throw err;
    });
  }
  return resvgReady;
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
    ensureSatori(origin, fetcher),
    ensureResvg(origin, fetcher),
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
