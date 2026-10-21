<script lang="ts">
  // The field guide as a sea: one breaking wave for each family of record
  // types, as tall as the number of repos on the network that carry it. The
  // scale is logarithmic so a lexicon in one repo still raises a ripple.

  type Family = { key: string; name: string; repos: number };
  let { families }: { families: Family[] } = $props();

  const W = 1000;
  const H = 280;
  const BASE = 236;

  const top = $derived(Math.log10(Math.max(2, ...families.map((f) => f.repos)) + 1));
  const waves = $derived(
    families.map((f, i) => {
      const x = ((i + 0.5) * W) / families.length;
      const h = 34 + 150 * (Math.log10(f.repos + 1) / top);
      const s = Math.min(1.25, 0.55 + h / 260);
      return { ...f, x, h, s };
    })
  );

  // A curling crest: up the back of the wave, over, and hooking back down
  // into its own face.
  function wave(x: number, h: number, s: number) {
    const t = BASE - h;
    return [
      `M ${x - 120 * s} ${BASE}`,
      `C ${x - 80 * s} ${BASE - 10} ${x - 46 * s} ${t + h * 0.35} ${x - 8 * s} ${t + 6}`,
      `C ${x + 12 * s} ${t - 8} ${x + 44 * s} ${t - 6} ${x + 54 * s} ${t + 14}`,
      `C ${x + 40 * s} ${t + 8} ${x + 24 * s} ${t + 14} ${x + 22 * s} ${t + 30}`,
      `C ${x + 22 * s} ${t + h * 0.55} ${x + 60 * s} ${BASE - 8} ${x + 110 * s} ${BASE}`,
      'Z'
    ].join(' ');
  }

  // Foam: claws of spray along the lip.
  function foam(x: number, h: number, s: number) {
    const t = BASE - h;
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 5) * Math.PI * 0.9 + Math.PI * 0.05;
      return { cx: x + 22 * s - Math.cos(a) * 30 * s, cy: t + 10 - Math.sin(a) * 12 * s, r: (4 - i * 0.35) * s };
    });
  }
</script>

<svg class="wave-print" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="wave-print-title">
  <title id="wave-print-title">
    One wave for each family of record types; the taller the wave, the more repos on the network
    carry it.
  </title>
  <rect width={W} height={H} fill="var(--wb-paper)" />
  <rect width={W} height={H * 0.55} fill="url(#wave-sky)" />
  <defs>
    <linearGradient id="wave-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--wb-blue-light)" stop-opacity="0.55" />
      <stop offset="1" stop-color="var(--wb-blue-light)" stop-opacity="0" />
    </linearGradient>
  </defs>

  {#each waves as w (w.key)}
    <a href={`/lexicons#${w.key}`} aria-label={`${w.name}: ${w.repos} repos`}>
      <path d={wave(w.x, w.h, w.s)} fill="var(--wb-blue)" transform="translate(2 1.5)" />
      <path d={wave(w.x, w.h, w.s)} class="key" fill="none" />
      <path
        d={`M ${w.x - 70 * w.s} ${BASE - 6} C ${w.x - 40 * w.s} ${BASE - w.h * 0.45} ${w.x - 10 * w.s} ${BASE - w.h * 0.8} ${w.x + 6 * w.s} ${BASE - w.h + 14}`}
        class="vein"
        fill="none"
      />
      {#each foam(w.x, w.h, w.s) as f}
        <circle cx={f.cx} cy={f.cy} r={f.r} class="foam" />
      {/each}
    </a>
  {/each}

  <rect x="0" y={BASE} width={W} height={H - BASE} fill="var(--wb-indigo)" />
  <line x1="0" x2={W} y1={BASE} y2={BASE} class="key" />
</svg>

<style>
  .wave-print {
    display: block;
    width: 100%;
    height: auto;
  }

  .key {
    stroke: var(--wb-key);
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .vein {
    stroke: var(--wb-blue-light);
    stroke-width: 1.5;
  }

  .foam {
    fill: var(--wb-snow);
    stroke: var(--wb-key);
    stroke-width: 1;
  }

  a:hover path:first-child,
  a:focus-visible path:first-child {
    fill: var(--wb-blue-light);
  }

  a:focus-visible {
    outline: none;
  }
</style>
