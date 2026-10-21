<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { lensHref } from '$lib/lens/paths';
  import { shortName } from '$lib/lens/apps';
  import { describeRecord, type Specimen } from '$lib/lens/specimen';
  import { tidToMs } from '$lib/lens/scope';
  import { BAND_END, BAND_START, formatFreq, type Station } from '$lib/dial/stations';

  let { data } = $props();

  const stations: Station[] = untrack(() => data.stations);
  const own = untrack(() => ({ did: data.did, handle: data.handle }));
  const repo = own.handle || own.did;

  // Geometry: roughly 190px between stations, whatever the count.
  const SPACING_PX = 190;
  const step = (BAND_END - BAND_START) / Math.max(stations.length, 1);
  const pxPerMHz = SPACING_PX / step;
  const BAND_PAD = 600;
  const bandWidth = (BAND_END - BAND_START) * pxPerMHz + BAND_PAD * 2;
  const xOf = (freq: number) => BAND_PAD + (freq - BAND_START) * pxPerMHz;

  const ticks = Array.from({ length: Math.round((BAND_END - BAND_START) * 5) + 1 }, (_, i) => {
    const freq = BAND_START + i * 0.2;
    return { x: xOf(freq), major: i % 5 === 0, label: i % 10 === 0 ? String(Math.round(freq)) : '' };
  });

  const initialKey = untrack(() => page.url.searchParams.get('s'));
  const initial =
    stations.find((s) => s.key === initialKey) ??
    stations.find((s) => s.key === 'standard.site') ??
    stations[0];

  let freq = $state(initial?.freq ?? BAND_START);
  let width = $state(960);
  let dragging = $state(false);
  let sound = $state(false);
  let reduceMotion = $state(false);

  const nearest = $derived(
    stations.reduce<Station | null>(
      (best, s) => (!best || Math.abs(s.freq - freq) < Math.abs(best.freq - freq) ? s : best),
      null
    )
  );
  const signal = $derived.by(() => {
    if (!nearest) return 0;
    const t = Math.max(0, 1 - Math.abs(nearest.freq - freq) / (step * 0.45));
    return t * t * (3 - 2 * t);
  });
  const tuned = $derived(signal > 0.55 ? nearest : null);
  const offset = $derived(width / 2 - xOf(freq));

  // ——— last heard: one record per collection, read in the background ———

  let lastHeard = $state<Record<string, number>>({});

  async function readList(collection: string, limit: number) {
    const url = new URL('/xrpc/com.atproto.repo.listRecords', data.pds);
    url.searchParams.set('repo', data.did);
    url.searchParams.set('collection', collection);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = (await res.json()) as {
      records: { uri: string; value: Record<string, unknown> }[];
    };
    return body.records;
  }

  const recordMs = (uri: string, value: Record<string, unknown>) => {
    const rkey = uri.split('/').at(-1) ?? '';
    const fromKey = tidToMs(rkey);
    if (fromKey) return fromKey;
    const at = Date.parse(String(value.createdAt ?? ''));
    return Number.isFinite(at) ? at : 0;
  };

  $effect(() => {
    let cancelled = false;
    const queue = stations.flatMap((s) => s.collections.map((c) => ({ key: s.key, c })));
    const worker = async () => {
      while (!cancelled && queue.length) {
        const { key, c } = queue.shift()!;
        const records = await readList(c, 1).catch(() => []);
        const ms = records[0] ? recordMs(records[0].uri, records[0].value) : 0;
        if (ms > (lastHeard[key] ?? 0)) lastHeard[key] = ms;
      }
    };
    untrack(() => Array.from({ length: 6 }, worker));
    return () => (cancelled = true);
  });

  // ——— the broadcast: whatever station the needle settles on ———

  type Item = {
    uri: string;
    collection: string;
    rkey: string;
    ms: number;
    spec: Specimen;
  };
  const programme = new Map<string, Promise<Item[]>>();
  let showing = $state<{ station: Station; items: Item[] } | null>(null);
  // Static over the broadcast: off-station, or still waiting for the new
  // station's programme to come in.
  const noise = $derived(
    Math.max(1 - signal, tuned && showing && showing.station.key !== tuned.key ? 0.3 : 0)
  );
  let loading = $state(false);

  function load(station: Station) {
    let p = programme.get(station.key);
    if (!p) {
      p = Promise.all(
        station.collections.slice(0, 12).map(async (collection) =>
          (await readList(collection, 8).catch(() => [])).map((r) => ({
            uri: r.uri,
            collection,
            rkey: r.uri.split('/').at(-1) ?? '',
            ms: recordMs(r.uri, r.value),
            spec: describeRecord(collection, r.value, own)
          }))
        )
      ).then((lists) => {
        const all = lists.flat().sort((a, b) => b.ms - a.ms);
        // Plenty of records are bookkeeping with nothing to read (a request
        // id, a recommendation pointer). Lead with the ones that say something.
        const legible = all.filter((i) => i.spec.text || (i.spec.title && !i.spec.ref));
        return (legible.length >= 4 ? legible : all).slice(0, 14);
      });
      programme.set(station.key, p);
    }
    return p;
  }

  $effect(() => {
    const station = tuned;
    if (!station || dragging) return;
    // Wait for the needle to settle so sweeping across the band doesn't read
    // every station on the way past.
    const timer = setTimeout(async () => {
      if (showing?.station.key === station.key) return;
      loading = true;
      const items = await load(station);
      if (tuned?.key !== station.key) return;
      showing = { station, items };
      loading = false;
      const url = new URL(page.url);
      url.searchParams.set('s', station.key);
      replaceState(url, {});
    }, 220);
    return () => clearTimeout(timer);
  });

  // ——— tuning physics ———

  let velocity = 0;
  let target: number | null = null;
  let lastX = 0;
  let lastT = 0;
  let idleSince = 0;
  let frame = 0;
  let windowEl = $state<HTMLDivElement>();

  const clamp = (f: number) => Math.min(BAND_END, Math.max(BAND_START, f));

  function tick(now: number) {
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
    lastT = now;
    if (!dragging) {
      if (target !== null) {
        freq = Math.abs(target - freq) < 0.002 ? target : freq + (target - freq) * Math.min(1, dt * 9);
        if (freq === target) target = null;
      } else if (Math.abs(velocity) > 0.05) {
        freq = clamp(freq + velocity * dt);
        velocity *= Math.exp(-dt * 3.2);
      } else if (nearest && now - idleSince > 180 && signal < 1) {
        // Like a fine-tuning knob finding the carrier: drift onto the station.
        velocity = 0;
        target = nearest.freq;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  $effect(() => {
    reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  function tuneTo(station: Station) {
    velocity = 0;
    if (reduceMotion) {
      freq = station.freq;
      target = null;
    } else target = station.freq;
  }

  function onpointerdown(e: PointerEvent) {
    windowEl?.setPointerCapture(e.pointerId);
    dragging = true;
    target = null;
    velocity = 0;
    lastX = e.clientX;
  }

  function onpointermove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    const df = -dx / pxPerMHz;
    freq = clamp(freq + df);
    const dt = Math.max(e.timeStamp - idleSince, 8) / 1000;
    velocity = velocity * 0.6 + (df / dt) * 0.4;
    idleSince = e.timeStamp;
  }

  function onpointerup() {
    dragging = false;
    idleSince = performance.now();
    if (reduceMotion) velocity = 0;
  }

  function onwheel(e: WheelEvent) {
    e.preventDefault();
    target = null;
    velocity = 0;
    freq = clamp(freq + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / pxPerMHz);
    idleSince = performance.now();
  }

  function onkeydown(e: KeyboardEvent) {
    const index = nearest ? stations.indexOf(nearest) : 0;
    const go = (i: number) => {
      e.preventDefault();
      tuneTo(stations[Math.max(0, Math.min(stations.length - 1, i))]);
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') go(index + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') go(index - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(stations.length - 1);
  }

  // ——— static: drawn over the broadcast while the needle is between stations ———

  let staticEl = $state<HTMLCanvasElement>();

  $effect(() => {
    const canvas = staticEl;
    if (!canvas) return;
    // With reduced motion the grain is drawn once per change of tuning
    // instead of every frame.
    if (reduceMotion) void noise;
    const c = canvas.getContext('2d')!;
    const ink = getComputedStyle(canvas).color;
    // Grain about 3px across, whatever size the broadcast is.
    const fit = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth / 3));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight / 3));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    let raf = 0;
    const draw = () => {
      const amount = noise;
      c.clearRect(0, 0, canvas.width, canvas.height);
      if (amount > 0.01) {
        c.fillStyle = ink;
        const n = Math.floor(canvas.width * canvas.height * 0.18 * amount);
        for (let i = 0; i < n; i++) {
          c.globalAlpha = Math.random() * 0.9;
          c.fillRect(
            Math.floor(Math.random() * canvas.width),
            Math.floor(Math.random() * canvas.height),
            1,
            1
          );
        }
        c.globalAlpha = 1;
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  });

  // ——— sound: optional hiss between stations ———

  let audio: { ctx: AudioContext; gain: GainNode } | null = null;

  function toggleSound() {
    sound = !sound;
    if (sound && !audio) {
      const ctx = new AudioContext();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 1600;
      band.Q.value = 0.6;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(band).connect(gain).connect(ctx.destination);
      source.start();
      audio = { ctx, gain };
    }
    if (audio) (sound ? audio.ctx.resume() : audio.ctx.suspend());
  }

  $effect(() => {
    const level = sound ? (1 - signal) * 0.06 : 0;
    if (audio) audio.gain.gain.setTargetAtTime(level, audio.ctx.currentTime, 0.04);
  });

  $effect(() => () => audio?.ctx.close());

  // ——— formatting ———

  function ago(ms: number | undefined) {
    if (!ms) return '';
    const minutes = (Date.now() - ms) / 60000;
    if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m ago`;
    const hours = minutes / 60;
    if (hours < 48) return `${Math.round(hours)}h ago`;
    const days = hours / 24;
    if (days < 60) return `${Math.round(days)}d ago`;
    const months = days / 30;
    if (months < 24) return `${Math.round(months)}mo ago`;
    return `${Math.round(months / 12)}y ago`;
  }

  const dateOf = (ms: number) =>
    ms
      ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
  const hostOf = (url?: string) => {
    try {
      return url ? new URL(url).host.replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  };

  // How loud a station is on the band: recent writing is a strong carrier.
  function strength(key: string) {
    const ms = lastHeard[key];
    if (!ms) return 0;
    const days = (Date.now() - ms) / 86_400_000;
    return days < 1 ? 1 : days < 7 ? 0.75 : days < 60 ? 0.5 : 0.25;
  }
</script>

<svelte:head>
  <title>The dial · disnetdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="proto-intro">
  <p class="page-eyebrow">prototype · the dial</p>
  <h1 class="page-heading">Tune across my repo</h1>
  <p class="page-lede">
    Every app that writes to my repo is a station, in namespace order. Drag the dial, scroll it, or
    use the arrow keys. Stations that wrote something lately come in strongest.
  </p>
</section>

<section class="dial" aria-label="Tuning dial">
  <div
    class="dial-window"
    class:is-dragging={dragging}
    bind:this={windowEl}
    bind:clientWidth={width}
    role="slider"
    tabindex="0"
    aria-label="Station"
    aria-valuemin={BAND_START}
    aria-valuemax={BAND_END}
    aria-valuenow={Math.round(freq * 10) / 10}
    aria-valuetext={tuned ? `${formatFreq(tuned.freq)}, ${tuned.name}` : `${formatFreq(freq)}, static`}
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    onpointercancel={onpointerup}
    {onwheel}
    {onkeydown}
  >
    <svg
      class="dial-band"
      width={bandWidth}
      height="132"
      style:transform={`translateX(${offset}px)`}
      aria-hidden="true"
    >
      <line class="dial-rail" x1={xOf(BAND_START)} x2={xOf(BAND_END)} y1="96" y2="96" />
      {#each ticks as t}
        <line class="dial-tick" class:is-major={t.major} x1={t.x} x2={t.x} y1="96" y2={t.major ? 110 : 103} />
        {#if t.label}<text class="dial-num" x={t.x} y="126">{t.label}</text>{/if}
      {/each}
      {#each stations as s, i}
        {@const x = xOf(s.freq)}
        {@const loud = strength(s.key)}
        {@const row = i % 2}
        <g class="dial-station" class:is-tuned={tuned?.key === s.key}>
          <line class="dial-station-mark" x1={x} x2={x} y1={row ? 58 : 40} y2="96" />
          <rect class="dial-carrier" x={x - 3} y={96 - 4 - loud * 14} width="6" height={4 + loud * 14} />
          <text class="dial-station-name" {x} y={row ? 52 : 34}>{s.name}</text>
          <text class="dial-station-freq" {x} y={row ? 52 : 34} dy="-14">{formatFreq(s.freq)}</text>
        </g>
      {/each}
    </svg>
    <div class="dial-needle" aria-hidden="true"></div>
  </div>

  <div class="dial-readout">
    <span class="dial-readout-freq">{formatFreq(freq)}</span>
    <span class="dial-readout-unit">MHz</span>
    <span class="dial-readout-name">{tuned ? tuned.name : 'static'}</span>
    <span class="dial-meter" aria-label={`Signal ${Math.round(signal * 100)}%`}>
      {#each [0.2, 0.4, 0.6, 0.8, 0.98] as bar}
        <span class="dial-meter-bar" class:is-on={signal >= bar}></span>
      {/each}
    </span>
    <button class="dial-sound" type="button" aria-pressed={sound} onclick={toggleSound}>
      sound {sound ? 'on' : 'off'}
    </button>
  </div>

  <details class="dial-all">
  <summary>all {stations.length} stations</summary>
  <nav class="dial-presets" aria-label="Stations">
    {#each stations as s}
      <button
        type="button"
        class="dial-preset"
        class:is-tuned={tuned?.key === s.key}
        style:--loud={strength(s.key)}
        onclick={() => tuneTo(s)}
      >
        <span class="dial-preset-freq">{formatFreq(s.freq)}</span>
        {s.name}
      </button>
    {/each}
  </nav>
  </details>
</section>

<section
  class="broadcast"
  style:--static={noise}
  aria-live="polite"
  aria-busy={loading}
>
  <canvas class="broadcast-static" bind:this={staticEl} aria-hidden="true"></canvas>
  {#if showing}
    {@const s = showing.station}
    <header class="broadcast-head">
      <p class="broadcast-on">
        <span class="broadcast-dot" aria-hidden="true"></span>
        on air · {formatFreq(s.freq)} · {s.authority}.*
      </p>
      <h2 class="broadcast-name">
        {#if s.home}<a href={s.home} rel="noopener">{s.name}</a>{:else}{s.name}{/if}
      </h2>
      <p class="broadcast-meta">
        {s.collections.length} collection{s.collections.length === 1 ? '' : 's'}
        {#if lastHeard[s.key]}· last heard {ago(lastHeard[s.key])}{/if}
      </p>
    </header>

    {#if showing.items.length === 0}
      <p class="broadcast-empty">A carrier and nothing on it. This station hasn't said anything lately.</p>
    {:else if s.register === 'essay'}
      <ol class="reg-essay">
        {#each showing.items as item (item.uri)}
          <li>
            <time class="reg-date">{dateOf(item.ms)}</time>
            <h3 class="reg-essay-title">
              <a href={lensHref(repo, item.collection, item.rkey)}>{item.spec.title ?? shortName(item.collection)}</a>
            </h3>
            {#if item.spec.text}<p class="reg-essay-text">{item.spec.text}</p>{/if}
          </li>
        {/each}
      </ol>
    {:else if s.register === 'transcript'}
      <ol class="reg-transcript">
        {#each showing.items as item (item.uri)}
          <li>
            <time class="reg-date">{ago(item.ms)}</time>
            <a class="reg-transcript-line" href={lensHref(repo, item.collection, item.rkey)}>
              {item.spec.text ?? item.spec.title ?? shortName(item.collection)}
            </a>
          </li>
        {/each}
      </ol>
    {:else if s.register === 'reading'}
      <ol class="reg-reading">
        {#each showing.items as item (item.uri)}
          <li>
            <h3 class="reg-reading-title">
              {#if item.spec.url}
                <a href={item.spec.url} rel="noopener">{item.spec.title ?? hostOf(item.spec.url)}</a>
              {:else}
                <a href={lensHref(repo, item.collection, item.rkey)}>{item.spec.title ?? shortName(item.collection)}</a>
              {/if}
            </h3>
            <p class="reg-meta">
              {#if item.spec.url}{hostOf(item.spec.url)} · {/if}{shortName(item.collection)} · {ago(item.ms)}
            </p>
            {#if item.spec.text && item.spec.text !== item.spec.title}
              <p class="reg-reading-note">{item.spec.text}</p>
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <ol class="reg-log">
        {#each showing.items as item (item.uri)}
          <li>
            <time class="reg-date">{ago(item.ms)}</time>
            <span class="reg-log-kind">{item.spec.status ?? shortName(item.collection)}</span>
            <a class="reg-log-title" href={lensHref(repo, item.collection, item.rkey)}>
              {item.spec.title ?? item.spec.text ?? item.rkey}
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  {:else}
    <p class="broadcast-empty">Warming up the set…</p>
  {/if}
</section>

<style>
  .dial {
    margin-inline: calc(-1 * clamp(var(--space-md), 4vw, var(--space-xl)));
    border-top: 2px solid var(--ink-text);
    border-bottom: var(--rule) solid var(--ink-rule);
  }

  .dial-window {
    position: relative;
    height: 132px;
    overflow: hidden;
    cursor: grab;
    touch-action: pan-y;
    user-select: none;
    outline: none;
    background: var(--ink-surface);
  }

  .dial-window.is-dragging {
    cursor: grabbing;
  }

  .dial-window:focus-visible {
    box-shadow: inset 0 0 0 2px var(--ink-accent);
  }

  /* Fade the band out at both edges, like a dial glass. */
  .dial-window::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      var(--ink-surface) 0,
      transparent 18%,
      transparent 82%,
      var(--ink-surface) 100%
    );
  }

  .dial-band {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    will-change: transform;
  }

  .dial-rail {
    stroke: var(--ink-text);
    stroke-width: 1.5;
  }

  .dial-tick {
    stroke: var(--ink-muted);
    stroke-width: 1;
  }

  .dial-tick.is-major {
    stroke: var(--ink-text);
  }

  .dial-num {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 10px;
    text-anchor: middle;
  }

  .dial-station-mark {
    stroke: var(--ink-rule);
    stroke-width: 1;
  }

  .dial-carrier {
    fill: var(--ink-text);
  }

  /* A halo of dial glass so the needle passes behind the lettering. */
  .dial-station-name,
  .dial-station-freq {
    paint-order: stroke;
    stroke: var(--ink-surface);
    stroke-width: 5px;
    stroke-linejoin: round;
  }

  .dial-station-name {
    fill: var(--ink-text);
    font-family: var(--font-display);
    font-weight: 620;
    font-size: 13px;
    text-anchor: middle;
  }

  .dial-station-freq {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 9.5px;
    text-anchor: middle;
  }

  .dial-station.is-tuned .dial-station-name,
  .dial-station.is-tuned .dial-station-freq {
    fill: var(--ink-accent);
  }

  .dial-station.is-tuned .dial-carrier {
    fill: var(--ink-accent);
  }

  .dial-needle {
    position: absolute;
    top: 10px;
    bottom: 0;
    left: 50%;
    width: 2px;
    margin-left: -1px;
    background: var(--ink-accent);
    z-index: 1;
    pointer-events: none;
  }

  .dial-needle::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -4px;
    width: 10px;
    height: 10px;
    background: var(--ink-accent);
  }

  .dial-readout {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
    flex-wrap: wrap;
    padding: var(--space-xs) clamp(var(--space-md), 4vw, var(--space-xl));
    border-top: var(--rule) solid var(--ink-rule-soft);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  .dial-readout-freq {
    font-size: var(--type-lg);
    color: var(--ink-text);
    font-variant-numeric: tabular-nums;
    min-width: 5ch;
    text-align: right;
  }

  .dial-readout-name {
    font-family: var(--font-display);
    font-weight: 620;
    font-size: var(--type-sm);
    color: var(--ink-text);
  }

  .dial-meter {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
    margin-left: var(--space-2xs);
  }

  .dial-meter-bar {
    width: 4px;
    background: var(--ink-rule);
  }

  .dial-meter-bar:nth-child(1) { height: 4px; }
  .dial-meter-bar:nth-child(2) { height: 6px; }
  .dial-meter-bar:nth-child(3) { height: 8px; }
  .dial-meter-bar:nth-child(4) { height: 10px; }
  .dial-meter-bar:nth-child(5) { height: 12px; }

  .dial-meter-bar.is-on {
    background: var(--ink-accent);
  }

  .dial-sound {
    margin-left: auto;
    font: inherit;
    color: var(--ink-text-soft);
    background: none;
    border: var(--rule) solid var(--ink-rule);
    padding: 0.2em 0.6em;
    cursor: pointer;
  }

  .dial-sound[aria-pressed='true'] {
    color: var(--ink-accent);
    border-color: currentColor;
  }

  .dial-all summary {
    padding: 0 clamp(var(--space-md), 4vw, var(--space-xl)) var(--space-xs);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    cursor: pointer;
  }

  .dial-presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3xs) var(--space-2xs);
    padding: var(--space-xs) clamp(var(--space-md), 4vw, var(--space-xl)) var(--space-sm);
  }

  .dial-preset {
    font-family: var(--font-meta);
    font-size: var(--type-xs);
    color: color-mix(in oklch, var(--ink-text) calc(45% + var(--loud) * 55%), var(--ink-page));
    background: none;
    border: 0;
    padding: 0.15em 0;
    cursor: pointer;
  }

  .dial-preset-freq {
    font-family: var(--font-mono);
    color: var(--ink-muted);
    margin-right: 0.3em;
  }

  .dial-preset:hover,
  .dial-preset.is-tuned {
    color: var(--ink-accent);
  }

  /* ——— broadcast ——— */

  .broadcast {
    position: relative;
    max-width: var(--measure-wide);
    margin-top: var(--space-xl);
    min-height: 24rem;
  }

  .broadcast > :not(canvas) {
    filter: blur(calc(var(--static) * 3px));
    opacity: calc(1 - var(--static) * 0.75);
  }

  .broadcast-static {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    color: var(--ink-text);
    image-rendering: pixelated;
    pointer-events: none;
    opacity: calc(var(--static) * 0.9);
    z-index: 1;
  }

  .broadcast-on {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  .broadcast-dot {
    width: 8px;
    height: 8px;
    background: var(--ink-accent);
  }

  .broadcast-name {
    margin: var(--space-3xs) 0 0;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-h1);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .broadcast-name a {
    color: inherit;
    text-decoration: none;
  }

  .broadcast-meta {
    margin: var(--space-2xs) 0 var(--space-lg);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  .broadcast-empty {
    color: var(--ink-text-soft);
    font-style: italic;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 2px solid var(--ink-text);
  }

  li {
    border-bottom: var(--rule) solid var(--ink-rule-soft);
  }

  a {
    color: inherit;
  }

  .reg-date,
  .reg-meta {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  /* essay: the page of a literary journal */
  .reg-essay li {
    padding: var(--space-md) 0;
  }

  .reg-essay-title {
    margin: var(--space-3xs) 0;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-h2);
    line-height: 1.15;
    letter-spacing: -0.01em;
  }

  .reg-essay-title a {
    text-decoration: none;
  }

  .reg-essay-title a:hover {
    color: var(--ink-accent);
  }

  .reg-essay-text {
    margin: 0;
    max-width: var(--measure);
    color: var(--ink-text-soft);
  }

  /* transcript: a log of the station's chatter */
  .reg-transcript li {
    display: grid;
    grid-template-columns: 7ch 1fr;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
  }

  .reg-transcript .reg-date {
    padding-top: 0.35em;
  }

  .reg-transcript-line {
    text-decoration: none;
    max-width: var(--measure);
  }

  .reg-transcript-line:hover {
    color: var(--ink-accent);
  }

  /* reading: a list of things read and filed */
  .reg-reading li {
    padding: var(--space-sm) 0;
  }

  .reg-reading-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 640;
    font-size: var(--type-h4);
    line-height: 1.3;
  }

  .reg-reading-title a {
    text-decoration-color: var(--ink-accent);
    text-underline-offset: 0.2em;
  }

  .reg-meta {
    margin: var(--space-3xs) 0 0;
  }

  .reg-reading-note {
    margin: var(--space-2xs) 0 0;
    max-width: var(--measure);
    color: var(--ink-text-soft);
    font-size: var(--type-lg);
  }

  /* log: work moving through Radial, atplan, Tangled */
  .reg-log li {
    display: grid;
    grid-template-columns: 7ch 13ch 1fr;
    gap: var(--space-sm);
    align-items: baseline;
    padding: var(--space-xs) 0;
  }

  .reg-log-kind {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reg-log-title {
    font-family: var(--font-display);
    font-weight: 560;
    font-size: var(--type-sm);
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .reg-log-title:hover {
    color: var(--ink-accent);
  }

  @media (max-width: 40rem) {
    .reg-log li {
      grid-template-columns: 7ch 1fr;
    }

    .reg-log-kind {
      grid-column: 2;
      grid-row: 1;
    }

    .reg-log-title {
      grid-column: 1 / -1;
    }
  }
</style>
