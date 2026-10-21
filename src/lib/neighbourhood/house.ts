// Elevation drawings for the street. Every house is generated from its
// owner's DID, so it looks the same on every visit and nobody's is picked by
// hand. Client-safe.

export type Neighbour = {
  did: string;
  handle: string;
  name: string;
  avatar?: string;
  bio?: string;
  lastActive?: string;
};

export const BAY = 24;
export const FLOOR = 38;
export const SIDE = 10;

export type Roof = 'gable' | 'flat' | 'shed' | 'sawtooth' | 'hip';
export type Lights = 'home' | 'evening' | 'porch' | 'dark';

export type House = {
  bays: number;
  floors: number;
  roof: Roof;
  chimney: boolean;
  door: number;
  width: number;
  wallHeight: number;
  // Window order for lighting: the first n in this list are lit.
  order: number[];
};

function hasher(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

const ROOFS: Roof[] = ['gable', 'gable', 'flat', 'shed', 'sawtooth', 'hip'];

export function houseFor(did: string, overrides: Partial<House> = {}): House {
  const rand = hasher(did);
  const bays = 2 + Math.floor(rand() * 3);
  const floors = 1 + Math.floor(rand() * rand() * 3.2);
  const roof = ROOFS[Math.floor(rand() * ROOFS.length)];
  const chimney = rand() > 0.45;
  const door = Math.floor(rand() * bays);
  const windows = bays * floors;
  const order = Array.from({ length: windows }, (_, i) => i)
    .map((i) => ({ i, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((w) => w.i);
  const house = { bays, floors, roof, chimney, door, order, width: 0, wallHeight: 0, ...overrides };
  house.width = house.bays * BAY + SIDE * 2;
  house.wallHeight = house.floors * FLOOR;
  if (overrides.order === undefined && (overrides.bays || overrides.floors)) {
    house.order = Array.from({ length: house.bays * house.floors }, (_, i) => i);
  }
  return house;
}

export function roofHeight(house: House) {
  switch (house.roof) {
    case 'gable':
      return house.width * 0.36;
    case 'hip':
      return house.width * 0.26;
    case 'shed':
      return 20;
    case 'sawtooth':
      return 16;
    default:
      return 6;
  }
}

export function lightsFor(lastActive: string | undefined, now = Date.now()): Lights {
  const at = lastActive ? Date.parse(lastActive) : NaN;
  if (!Number.isFinite(at)) return 'dark';
  const hours = (now - at) / 3_600_000;
  if (hours < 3) return 'home';
  if (hours < 36) return 'evening';
  if (hours < 24 * 10) return 'porch';
  return 'dark';
}

export function litCount(house: House, lights: Lights) {
  const windows = house.bays * house.floors;
  if (lights === 'home') return Math.max(1, Math.round(windows * 0.7));
  if (lights === 'evening') return Math.max(1, Math.round(windows * 0.35));
  return 0;
}

export function ago(iso: string | undefined, now = Date.now()) {
  const at = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(at)) return 'quiet';
  const minutes = (now - at) / 60000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m ago`;
  const hours = minutes / 60;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 60) return `${Math.round(days)}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}
