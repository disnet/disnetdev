<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { lensHref } from '$lib/lens/paths';
  import {
    SCOPE_RINGS,
    jitter,
    layoutSectors,
    radiusForAge,
    tidToMs,
    type Sector
  } from '$lib/lens/scope';

  // A radar over one repo. Every record is a blip: its app picks the bearing,
  // its age the range. The browser reads the PDS directly (repos are public
  // and PDSes send CORS headers), so blips arrive collection by collection
  // while the sweep turns.

  type Highlight = { uri: string; label: string; title: string };

  let {
    did,
    pds,
    repo,
    collections,
    highlights = [],
    focused = $bindable<string | null>(null),
    label = 'Repo scope'
  }: {
    did: string;
    pds: string;
    repo: string;
    collections: string[];
    highlights?: Highlight[];
    focused?: string | null;
    label?: string;
  } = $props();

  const PER_COLLECTION = 40;
  const MAX_COLLECTIONS = 120;
  const CONCURRENCY = 6;
  const SWEEP_MS = 9000;
  const TRACK_MS = 4200;
  const RIM_MARGIN = 0.26; // of the canvas, kept clear for sector names

  type Blip = {
    collection: string;
    rkey: string;
    ms: number;
    angle: number;
    r: number;
    x: number;
    y: number;
  };

  let wrap = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let scanned = $state(0);
  let blipCount = $state(0);
  let hover = $state<{ x: number; y: number; blip: Blip } | null>(null);
  let hoverHighlight = $state<string | null>(null);

  const targets = $derived(collections.slice(0, MAX_COLLECTIONS));
  const sectors = $derived(layoutSectors(targets));

  function laneFor(nsid: string, list: Sector[]) {
    for (const sector of list) {
      const lane = sector.lanes.get(nsid);
      if (lane) return lane;
    }
    return null;
  }

  function place(collection: string, rkey: string, ms: number, list: Sector[], now: number) {
    const lane = laneFor(collection, list);
    if (!lane) return null;
    const angle = lane.centre + jitter(rkey) * lane.width * 0.85;
    const r = radiusForAge(now - ms) * (1 + jitter(rkey, 7) * 0.012);
    return { collection, rkey, ms, angle, r, x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }

  function relative(ms: number) {
    const mins = Math.round((Date.now() - ms) / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 48) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 60) return `${days}d ago`;
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Rebuild only when the repo or the tracked set changes; focus and hover
  // are read live by the draw loop, outside the effect's tracking.
  $effect(() => {
    if (!canvas || !wrap) return;
    const deps = { list: sectors, targets, highlights, did, pds, repo };
    return untrack(() => mount(canvas!, wrap!, deps));
  });

  function mount(
    canvas: HTMLCanvasElement,
    wrap: HTMLDivElement,
    { list, targets, highlights, did, pds, repo }: {
      list: Sector[];
      targets: string[];
      highlights: Highlight[];
      did: string;
      pds: string;
      repo: string;
    }
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    const blips: Blip[] = [];
    const tracked = highlights
      .map((h) => {
        const parts = h.uri.split('/');
        const ms = tidToMs(parts[4] ?? '');
        return ms ? { ...h, blip: place(parts[3], parts[4], ms, list, now) } : null;
      })
      .filter((h): h is Highlight & { blip: Blip } => Boolean(h?.blip));

    let cancelled = false;
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let colors = readColors();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const scheme = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => (colors = readColors());
    scheme.addEventListener('change', onScheme);

    function readColors() {
      const css = getComputedStyle(document.documentElement);
      const v = (name: string) => css.getPropertyValue(name).trim();
      return {
        text: v('--ink-text'),
        soft: v('--ink-text-soft'),
        muted: v('--ink-muted'),
        rule: v('--ink-rule'),
        ruleSoft: v('--ink-rule-soft'),
        accent: v('--ink-accent'),
        page: v('--ink-page'),
        surface: v('--ink-surface'),
        meta: css.getPropertyValue('--font-meta').trim(),
        mono: css.getPropertyValue('--font-mono').trim()
      };
    }

    // ——— reading the repo ———
    scanned = 0;
    blipCount = 0;
    const queue = [...targets];
    async function worker() {
      while (queue.length && !cancelled) {
        const collection = queue.shift()!;
        try {
          const url = `${pds}/xrpc/com.atproto.repo.listRecords?repo=${encodeURIComponent(did)}&collection=${encodeURIComponent(collection)}&limit=${PER_COLLECTION}`;
          const res = await fetch(url);
          if (res.ok) {
            const body = (await res.json()) as {
              records: { uri: string; value: { createdAt?: string } }[];
            };
            for (const record of body.records) {
              const rkey = record.uri.split('/').at(-1) ?? '';
              const ms = tidToMs(rkey) ?? Date.parse(record.value?.createdAt ?? '');
              if (!Number.isFinite(ms)) continue;
              const blip = place(collection, rkey, ms, list, now);
              if (blip) blips.push(blip);
            }
          }
        } catch {
          // A collection that won't load just stays dark.
        }
        if (cancelled) return;
        scanned += 1;
        blipCount = blips.length;
        if (reduced.matches) draw(0);
      }
    }
    Promise.all(Array.from({ length: CONCURRENCY }, worker));

    // ——— drawing ———
    // Sector names need room left and right; above and below, a little less.
    function R() {
      return (width / 2) * (1 - RIM_MARGIN);
    }

    function toScreen(b: { x: number; y: number }) {
      return { x: width / 2 + b.x * R(), y: height / 2 + b.y * R() };
    }

    function resize() {
      width = wrap.clientWidth;
      height = Math.round(2 * R() + 64);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`;
      if (reduced.matches) draw(0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();


    function draw(t: number) {
      const c = ctx!;
      const radius = R();
      const cx = width / 2;
      const cy = height / 2;
      const still = reduced.matches;
      const sweep = still ? -Math.PI / 2 : ((t % SWEEP_MS) / SWEEP_MS) * Math.PI * 2 - Math.PI / 2;

      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, width, height);

      // The scope face, a shade sunk into the page.
      c.fillStyle = colors.surface;
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.fill();

      // Range rings and their labels.
      c.lineWidth = 1;
      for (const ring of SCOPE_RINGS) {
        c.strokeStyle = colors.ruleSoft;
        c.beginPath();
        c.arc(cx, cy, ring.r * radius, 0, Math.PI * 2);
        c.stroke();
      }
      c.strokeStyle = colors.rule;
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.stroke();

      c.font = `10px ${colors.mono}`;
      c.fillStyle = colors.muted;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      for (const ring of SCOPE_RINGS) {
        c.fillText(ring.label, cx + 4, cy - ring.r * radius - 6);
      }

      // Sector boundaries, then names around the rim.
      c.font = `500 ${width < 420 ? 9 : 11}px ${colors.meta}`;
      let lastLabel = -Infinity;
      for (const sector of list) {
        c.strokeStyle = colors.ruleSoft;
        c.beginPath();
        c.moveTo(cx + Math.cos(sector.start) * radius * 0.05, cy + Math.sin(sector.start) * radius * 0.05);
        c.lineTo(cx + Math.cos(sector.start) * radius, cy + Math.sin(sector.start) * radius);
        c.stroke();

        // Narrow sectors go unnamed, and so does any name that would sit on
        // top of its neighbour's.
        const mid = (sector.start + sector.end) / 2;
        if (sector.end - sector.start < 0.12 || mid - lastLabel < 0.22) continue;
        lastLabel = mid;
        const lx = cx + Math.cos(mid) * (radius + 10);
        const ly = cy + Math.sin(mid) * (radius + 10);
        const cos = Math.cos(mid);
        c.textAlign = cos > 0.25 ? 'left' : cos < -0.25 ? 'right' : 'center';
        c.textBaseline = Math.sin(mid) > 0.3 ? 'top' : Math.sin(mid) < -0.3 ? 'bottom' : 'middle';
        const inSweep = !still && angularDistance(sweep, mid) < 0.5;
        c.fillStyle = inSweep ? colors.accent : colors.muted;
        // Keep the name on the canvas even when it hangs off the rim.
        const text = rimLabel(sector.name);
        const tw = c.measureText(text).width;
        const left = c.textAlign === 'left' ? lx : c.textAlign === 'right' ? lx - tw : lx - tw / 2;
        const shift = Math.max(0, 4 - left) - Math.max(0, left + tw - (width - 4));
        c.fillText(text, lx + shift, ly);
      }

      // The sweep: a phosphor wedge trailing the beam.
      if (!still) {
        const trail = 0.9;
        const gradient = c.createConicGradient(sweep - trail, cx, cy);
        const clear = withAlpha(colors.accent, 0);
        gradient.addColorStop(0, clear);
        gradient.addColorStop(trail / (Math.PI * 2), withAlpha(colors.accent, 0.24));
        gradient.addColorStop(trail / (Math.PI * 2) + 0.0005, clear);
        gradient.addColorStop(1, clear);
        c.fillStyle = gradient;
        c.beginPath();
        c.arc(cx, cy, radius, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = withAlpha(colors.accent, 0.8);
        c.lineWidth = 1.25;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(sweep) * radius, cy + Math.sin(sweep) * radius);
        c.stroke();
      }

      // Blips: muted ink at rest, amber as the beam passes, fading behind it.
      const dot = width < 420 ? 1.5 : 1.9;
      for (const b of blips) {
        const behind = still ? Math.PI : positiveAngle(sweep - b.angle);
        const glow = Math.exp(-behind * 1.6);
        const p = toScreen(b);
        if (glow > 0.04) {
          c.globalAlpha = Math.min(1, 0.25 + glow);
          c.fillStyle = colors.accent;
          c.beginPath();
          c.arc(p.x, p.y, dot * 0.75 + glow * 0.9, 0, Math.PI * 2);
          c.fill();
        } else {
          c.globalAlpha = 0.55;
          c.fillStyle = colors.soft;
          c.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
        }
      }
      c.globalAlpha = 1;

      // Tracked targets: the work in flight, each with a ring; the focused
      // one gets a callsign tag.
      const pulse = still ? 0 : (t % 1600) / 1600;
      for (const h of tracked) {
        const p = toScreen(h.blip);
        const isFocus = h.uri === focused || h.uri === hoverHighlight;
        c.strokeStyle = colors.accent;
        c.lineWidth = isFocus ? 1.5 : 1;
        c.beginPath();
        c.rect(p.x - 4.5, p.y - 4.5, 9, 9);
        c.stroke();
        if (isFocus) {
          if (!still) {
            c.globalAlpha = 1 - pulse;
            c.beginPath();
            c.arc(p.x, p.y, 6 + pulse * 14, 0, Math.PI * 2);
            c.stroke();
            c.globalAlpha = 1;
          }
          const right = p.x < cx;
          const tx = p.x + (right ? 22 : -22);
          const ty = p.y - 16;
          c.beginPath();
          c.moveTo(p.x + (right ? 5 : -5), p.y - 5);
          c.lineTo(tx, ty);
          c.stroke();
          c.font = `500 11px ${colors.mono}`;
          c.textAlign = right ? 'left' : 'right';
          c.textBaseline = 'middle';
          const w = c.measureText(h.label).width + 10;
          c.fillStyle = colors.page;
          c.fillRect(right ? tx : tx - w, ty - 9, w, 18);
          c.strokeRect(right ? tx : tx - w, ty - 9, w, 18);
          c.fillStyle = colors.accent;
          c.fillText(h.label, right ? tx + 5 : tx - 5, ty + 0.5);
        }
      }

      // Now, at the centre.
      c.fillStyle = colors.accent;
      c.beginPath();
      c.arc(cx, cy, 3, 0, Math.PI * 2);
      c.fill();
    }

    // Cycle the focus through tracked targets while nobody is pointing.
    let lastTrack = 0;
    let trackIndex = -1;
    function loop(t: number) {
      if (cancelled) return;
      if (!hoverHighlight && tracked.length && t - lastTrack > TRACK_MS && !reduced.matches) {
        if (!focused || tracked.some((h) => h.uri === focused) || trackIndex === -1) {
          trackIndex = (trackIndex + 1) % tracked.length;
          focused = tracked[trackIndex].uri;
        }
        lastTrack = t;
      }
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    if (reduced.matches) draw(0);
    else raf = requestAnimationFrame(loop);

    // ——— pointing ———
    function pick(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const near = (b: { x: number; y: number }, d: number) => {
        const p = toScreen(b);
        return (p.x - x) ** 2 + (p.y - y) ** 2 <= d * d;
      };
      const target = tracked.find((h) => near(h.blip, 9));
      if (target) return { x, y, highlight: target, blip: target.blip };
      let best: Blip | null = null;
      let bestD = 64;
      for (const b of blips) {
        const p = toScreen(b);
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          best = b;
          bestD = d;
        }
      }
      return best ? { x, y, highlight: null, blip: best } : null;
    }

    function onMove(event: PointerEvent) {
      const hit = pick(event);
      hoverHighlight = hit?.highlight?.uri ?? null;
      if (hit?.highlight) focused = hit.highlight.uri;
      hover = hit && !hit.highlight ? { x: hit.x, y: hit.y, blip: hit.blip } : null;
      canvas.style.cursor = hit ? 'pointer' : 'default';
      if (reduced.matches) draw(0);
    }
    function onLeave() {
      hover = null;
      hoverHighlight = null;
      if (reduced.matches) draw(0);
    }
    function onClick(event: PointerEvent) {
      const hit = pick(event);
      if (!hit) return;
      goto(lensHref(repo, hit.blip.collection, hit.blip.rkey));
    }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick as EventListener);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      scheme.removeEventListener('change', onScheme);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick as EventListener);
    };
  }

  // Rim space is tight: drop parentheticals and keep names short.
  function rimLabel(name: string) {
    const short = name.replace(/\s*\(.*\)$/, '').toLowerCase();
    return short.length > 14 ? `${short.slice(0, 13)}…` : short;
  }

  function positiveAngle(a: number) {
    const full = Math.PI * 2;
    return ((a % full) + full) % full;
  }

  function angularDistance(a: number, b: number) {
    const d = positiveAngle(a - b);
    return Math.min(d, Math.PI * 2 - d);
  }

  function withAlpha(color: string, alpha: number) {
    // Tokens are oklch(); append an alpha channel the canvas understands.
    return color.startsWith('oklch(') && !color.includes('/')
      ? color.replace(/\)\s*$/, ` / ${alpha})`)
      : color;
  }
</script>

<figure class="scope" aria-label={label}>
  <div class="scope-wrap" bind:this={wrap}>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
    {#if hover}
      <div
        class="scope-tip"
        style:left={`${hover.x}px`}
        style:top={`${hover.y}px`}
        class:scope-tip--left={wrap && hover.x > wrap.clientWidth / 2}>
        <span class="scope-tip-nsid">{hover.blip.collection}</span>
        <span class="scope-tip-when">{relative(hover.blip.ms)}</span>
      </div>
    {/if}
  </div>
  <figcaption class="scope-readout">
    {#if scanned < targets.length}
      scanning {scanned}/{targets.length} collections
    {:else}
      {targets.length} collections
    {/if}
    <span class="scope-sep">·</span>
    {blipCount.toLocaleString()} records
    <span class="scope-sep">·</span>
    centre is now, rim is two years
  </figcaption>
</figure>
