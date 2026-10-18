<script lang="ts">
  import { untrack } from 'svelte';
  import {
    BAY,
    FLOOR,
    SIDE,
    ago,
    houseFor,
    lightsFor,
    litCount,
    roofHeight,
    type House,
    type Lights,
    type Neighbour
  } from '$lib/neighbourhood/house';

  let { data } = $props();

  const street = untrack(() => data.street);
  const GAP = 30;

  type Lot = {
    who: Neighbour;
    me: boolean;
    house: House;
    lights: Lights;
    lit: number;
    x: number;
    tree: boolean;
  };

  // Closest neighbours live next door: first on the right, second on the
  // left, and so on outwards.
  const left = street.neighbours.filter((_, i) => i % 2 === 1).reverse();
  const right = street.neighbours.filter((_, i) => i % 2 === 0);
  const now = untrack(() => Date.parse(street.asOf));

  const lots: Lot[] = [];
  let cursor = 40;
  for (const who of [...left, street.me, ...right]) {
    const me = who.did === street.me.did;
    const house = me
      ? houseFor(who.did, { bays: 4, floors: 2, roof: 'sawtooth', chimney: false, door: 1 })
      : houseFor(who.did);
    const lights: Lights = me ? 'home' : lightsFor(who.lastActive, now);
    const tree = !me && who.did.charCodeAt(who.did.length - 1) % 3 === 0;
    if (tree) cursor += 26;
    lots.push({ who, me, house, lights, lit: me ? house.bays * house.floors : litCount(house, lights), x: cursor, tree });
    cursor += house.width + GAP;
  }
  const width = cursor + 10;
  // Sky enough for the tallest roof (or my mast) and a little night above it.
  const GROUND =
    Math.max(
      ...lots.map((l) => l.house.wallHeight + roofHeight(l.house) + (l.me ? 56 : 16))
    ) + 48;
  const HEIGHT = GROUND + 52;
  const meLot = lots.find((l) => l.me)!;

  const stars = Array.from({ length: 70 }, (_, i) => {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12543.123;
    return { x: (a - Math.floor(a)) * width, y: 8 + (b - Math.floor(b)) * (GROUND - 150), r: i % 7 === 0 ? 1.3 : 0.8 };
  });

  // ——— drawing ———

  function roofPath(h: House) {
    const w = h.width;
    const top = -h.wallHeight;
    const rh = roofHeight(h);
    switch (h.roof) {
      case 'gable':
        return `M -6 ${top} L ${w / 2} ${top - rh} L ${w + 6} ${top} Z`;
      case 'hip':
        return `M -5 ${top} L ${w * 0.28} ${top - rh} L ${w * 0.72} ${top - rh} L ${w + 5} ${top} Z`;
      case 'shed':
        return `M -5 ${top} L -5 ${top - rh} L ${w + 5} ${top - 5} L ${w + 5} ${top} Z`;
      case 'sawtooth': {
        const teeth = Math.max(2, h.bays - 1);
        let d = `M 0 ${top}`;
        for (let i = 0; i < teeth; i++) {
          const x0 = (w / teeth) * i;
          const x1 = (w / teeth) * (i + 1);
          d += ` L ${x0} ${top - rh} L ${x1} ${top}`;
        }
        return `${d} Z`;
      }
      default:
        return `M -3 ${top} L ${w + 3} ${top} L ${w + 3} ${top - 6} L -3 ${top - 6} Z`;
    }
  }

  function windows(h: House) {
    const out: { x: number; y: number; rank: number }[] = [];
    for (let f = 0; f < h.floors; f++) {
      for (let b = 0; b < h.bays; b++) {
        if (f === 0 && b === h.door) continue;
        const index = f * h.bays + b;
        out.push({ x: SIDE + b * BAY + 6, y: -(f + 1) * FLOOR + 10, rank: h.order.indexOf(index) });
      }
    }
    return out;
  }

  const peak = (h: House) =>
    h.roof === 'gable' || h.roof === 'hip' ? roofHeight(h) : h.roof === 'flat' ? 6 : roofHeight(h);

  // ——— life on the street ———

  let tick = $state(0);
  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => tick++, 2600);
    return () => clearInterval(timer);
  });

  // Someone who is home now moves between rooms: one window at a time goes
  // on or off.
  function isLit(lot: Lot, rank: number, index: number) {
    const on = rank < lot.lit;
    if (lot.lights !== 'home' || lot.me) return on;
    const windowsCount = lot.house.bays * lot.house.floors;
    const mover = (tick + index * 5) % (windowsCount + 3);
    return mover === rank ? !on : on;
  }

  let selected = $state<Lot>(untrack(() => meLot));
  let scroller = $state<HTMLDivElement>();

  $effect(() => {
    if (!scroller) return;
    scroller.scrollLeft = meLot.x + meLot.house.width / 2 - scroller.clientWidth / 2;
  });

  const hrefOf = (lot: Lot) =>
    lot.me ? `/@${lot.who.handle}` : `https://bsky.app/profile/${lot.who.handle}`;

  const LIGHT_WORDS: Record<Lights, string> = {
    home: 'lights on',
    evening: 'a lamp on',
    porch: 'porch light',
    dark: 'dark'
  };

  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const ordered = [street.me, ...street.neighbours];
  const lotOf = (did: string) => lots.find((l) => l.who.did === did)!;
</script>

<svelte:head>
  <title>The neighbourhood · disnetdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="proto-intro">
  <p class="page-eyebrow">prototype · the neighbourhood</p>
  <h1 class="page-heading">My street</h1>
  <p class="page-lede">
    The people I follow and keep coming back to, drawn from my own likes, reposts and replies. The
    closest live next door. Their lights are on when they've posted lately.
  </p>
</section>

<div class="street" bind:this={scroller}>
  <svg
    class="street-svg"
    {width}
    height={HEIGHT}
    viewBox={`0 0 ${width} ${HEIGHT}`}
    role="group"
    aria-label="Houses on the street"
  >
    <g class="street-stars" aria-hidden="true">
      {#each stars as s}<circle cx={s.x} cy={s.y} r={s.r} />{/each}
    </g>

    {#each lots as lot, index (lot.who.did)}
      {@const h = lot.house}
      {@const rh = roofHeight(h)}
      {#if lot.tree}
        <g class="street-tree" transform={`translate(${lot.x - 15}, ${GROUND})`} aria-hidden="true">
          <line x1="0" x2="0" y1="0" y2="-26" />
          <circle cx="0" cy="-40" r="14" />
        </g>
      {/if}
      <a
        href={hrefOf(lot)}
        rel={lot.me ? undefined : 'noopener'}
        aria-label={`${lot.who.name}, ${LIGHT_WORDS[lot.lights]}`}
        class="house"
        class:is-me={lot.me}
        class:is-selected={selected === lot}
        onmouseenter={() => (selected = lot)}
        onfocus={() => (selected = lot)}
      >
        <g transform={`translate(${lot.x}, ${GROUND})`}>
          {#if lot.me}
            <!-- The PDS mast: this is the house that broadcasts. -->
            <g class="house-mast">
              <line x1={h.width * 0.75} x2={h.width * 0.75} y1={-h.wallHeight - rh} y2={-h.wallHeight - rh - 46} />
              <line x1={h.width * 0.75 - 9} x2={h.width * 0.75 + 9} y1={-h.wallHeight - rh - 30} y2={-h.wallHeight - rh - 30} />
              <line x1={h.width * 0.75 - 5} x2={h.width * 0.75 + 5} y1={-h.wallHeight - rh - 40} y2={-h.wallHeight - rh - 40} />
              <rect class="house-mast-tip" x={h.width * 0.75 - 3} y={-h.wallHeight - rh - 52} width="6" height="6" />
            </g>
          {/if}
          {#if h.chimney}
            <rect
              class="house-line"
              x={h.width * 0.68}
              y={-h.wallHeight - peak(h) * 0.7 - 12}
              width="9"
              height={peak(h) * 0.7 + 12}
            />
          {/if}
          <path class="house-line house-roof" d={roofPath(h)} />
          <rect class="house-line house-wall" x="0" y={-h.wallHeight} width={h.width} height={h.wallHeight} />
          {#each windows(h) as w}
            <rect
              class="house-window"
              class:is-lit={isLit(lot, w.rank, index)}
              x={w.x}
              y={w.y}
              width="12"
              height="17"
            />
          {/each}
          <rect class="house-line" x={SIDE + h.door * BAY + 5} y="-27" width="14" height="27" />
          <rect
            class="house-porch"
            class:is-lit={lot.lights !== 'dark'}
            x={SIDE + h.door * BAY + 21}
            y="-25"
            width="3"
            height="3"
          />
          <text class="house-name" x={h.width / 2} y="24">{clip(lot.who.name, Math.floor((h.width + GAP) / 6.4))}</text>
          <text class="house-when" x={h.width / 2} y="40">{lot.me ? 'home' : ago(lot.who.lastActive, now)}</text>
        </g>
      </a>
    {/each}

    <line class="street-ground" x1="0" x2={width} y1={GROUND} y2={GROUND} />
  </svg>
</div>

<section class="nameplate" aria-live="polite">
  {#if selected.who.avatar}
    <img class="nameplate-avatar" src={selected.who.avatar} alt="" width="56" height="56" />
  {/if}
  <div>
    <p class="nameplate-name">
      <a href={hrefOf(selected)} rel={selected.me ? undefined : 'noopener'}>{selected.who.name}</a>
    </p>
    <p class="nameplate-meta">
      @{selected.who.handle} · {LIGHT_WORDS[selected.lights]}{#if selected.who.lastActive}{' · '}last
        seen {ago(selected.who.lastActive, now)}{/if}
    </p>
    {#if selected.who.bio}<p class="nameplate-bio">{selected.who.bio}</p>{/if}
    {#if selected.me}
      <p class="nameplate-bio">This is my place. Knock and the door opens onto my repo.</p>
    {/if}
  </div>
</section>

<section class="residents" aria-labelledby="residents-heading">
  <header class="residents-head">
    <h2 id="residents-heading" class="residents-title">Who lives here</h2>
    <span class="residents-note">nearest first</span>
  </header>
  <ol class="residents-list">
    {#each ordered as who (who.did)}
      {@const lot = lotOf(who.did)}
      <li class="resident" class:is-me={lot.me}>
        <span class="resident-light" data-lights={lot.lights} aria-hidden="true"></span>
        <a class="resident-name" href={hrefOf(lot)} rel={lot.me ? undefined : 'noopener'}>{who.name}</a>
        <span class="resident-handle">@{who.handle}</span>
        <span class="resident-when">{lot.me ? 'home' : LIGHT_WORDS[lot.lights]}</span>
      </li>
    {/each}
  </ol>
</section>

<style>
  .street {
    margin-inline: calc(-1 * clamp(var(--space-md), 4vw, var(--space-xl)));
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    border-bottom: var(--rule) solid var(--ink-rule-soft);
  }

  .street-svg {
    display: block;
  }

  .street-stars {
    display: none;
    fill: var(--ink-text-soft);
    opacity: 0.55;
  }

  @media (prefers-color-scheme: dark) {
    .street-stars {
      display: inline;
    }
  }

  .street-ground {
    stroke: var(--ink-text);
    stroke-width: 2;
  }

  .street-tree line,
  .street-tree circle {
    fill: none;
    stroke: var(--ink-muted);
    stroke-width: 1.25;
  }

  .house {
    outline: none;
    cursor: pointer;
    text-decoration: none;
  }

  .house-line {
    fill: var(--ink-page);
    stroke: var(--ink-text);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .house-roof {
    fill: var(--ink-surface);
  }

  .house:hover .house-line,
  .house:focus-visible .house-line,
  .house.is-selected .house-line {
    stroke: var(--ink-accent);
  }

  .house-window {
    fill: var(--ink-surface-sunken);
    stroke: var(--ink-text);
    stroke-width: 1;
    transition: fill 600ms ease;
  }

  .house-window.is-lit {
    fill: color-mix(in oklch, var(--ink-accent) 55%, var(--ink-page));
  }

  .is-me .house-window.is-lit {
    fill: var(--ink-accent);
  }

  @media (prefers-color-scheme: dark) {
    .house-line {
      fill: var(--ink-page);
    }

    .house-window {
      fill: var(--ink-surface-sunken);
    }

    .house-window.is-lit {
      fill: color-mix(in oklch, var(--ink-accent) 75%, white);
      filter: drop-shadow(0 0 5px color-mix(in oklch, var(--ink-accent) 70%, transparent));
    }
  }

  .house-porch {
    fill: var(--ink-rule);
  }

  .house-porch.is-lit {
    fill: var(--ink-accent);
  }

  .house-mast line {
    stroke: var(--ink-text);
    stroke-width: 1.5;
  }

  .house-mast-tip {
    fill: var(--ink-accent);
  }

  .house-name {
    fill: var(--ink-text);
    font-family: var(--font-display);
    font-weight: 620;
    font-size: 12px;
    text-anchor: middle;
  }

  .is-me .house-name {
    fill: var(--ink-accent);
  }

  .house-when {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 9.5px;
    text-anchor: middle;
  }

  /* ——— nameplate ——— */

  .nameplate {
    display: flex;
    gap: var(--space-sm);
    align-items: flex-start;
    max-width: var(--measure);
    margin: var(--space-lg) 0 var(--space-2xl);
    min-height: 6.5rem;
  }

  .nameplate-avatar {
    flex: none;
    width: 56px;
    height: 56px;
    object-fit: cover;
    border: var(--rule) solid var(--ink-rule);
  }

  .nameplate p {
    margin: 0;
  }

  .nameplate-name {
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-xl);
    line-height: 1.15;
  }

  .nameplate-name a {
    color: inherit;
    text-decoration: none;
  }

  .nameplate-name a:hover {
    color: var(--ink-accent);
  }

  .nameplate-meta {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    margin-top: var(--space-3xs) !important;
  }

  .nameplate-bio {
    margin-top: var(--space-2xs) !important;
    color: var(--ink-text-soft);
  }

  /* ——— residents ——— */

  .residents {
    max-width: var(--measure-wide);
  }

  .residents-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    border-top: 2px solid var(--ink-text);
    padding-top: var(--space-xs);
  }

  .residents-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-h2);
  }

  .residents-note {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .residents-list {
    list-style: none;
    margin: var(--space-sm) 0 0;
    padding: 0;
  }

  .resident {
    display: grid;
    grid-template-columns: 0.6rem minmax(0, 1fr) minmax(0, 1fr) 9rem;
    gap: var(--space-sm);
    align-items: baseline;
    padding: var(--space-xs) 0;
    border-bottom: var(--rule) solid var(--ink-rule-soft);
  }

  .resident-light {
    width: 0.55rem;
    height: 0.55rem;
    border: var(--rule) solid var(--ink-muted);
  }

  .resident-light[data-lights='home'] {
    background: var(--ink-accent);
    border-color: var(--ink-accent);
  }

  .resident-light[data-lights='evening'] {
    background: color-mix(in oklch, var(--ink-accent) 45%, var(--ink-page));
    border-color: var(--ink-accent);
  }

  .resident-light[data-lights='porch'] {
    border-color: var(--ink-accent);
  }

  .resident-name {
    font-family: var(--font-display);
    font-weight: 620;
    font-size: var(--type-sm);
    color: var(--ink-text);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .resident-name:hover {
    color: var(--ink-accent);
  }

  .resident-handle,
  .resident-when {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .resident-when {
    text-align: right;
  }

  @media (max-width: 40rem) {
    .resident {
      grid-template-columns: 0.6rem minmax(0, 1fr) auto;
    }

    .resident-handle {
      grid-column: 2 / -1;
      grid-row: 2;
    }
  }
</style>
