<script lang="ts">
  // The front print: a mountain under a graded sky, a range of hills in front
  // of it and the sea below. The hills are data: one peak for each of the last
  // sixteen weeks, as tall as that week's work in the ledger. Colour blocks
  // sit a hair off the key block, the way a hand-registered print does.

  let { range }: { range: { start: string; n: number }[] } = $props();

  const W = 1600;
  const H = 760;
  const HILLS = 590;
  const SEA = 640;
  // The peaks run from just inside the left edge to just short of the
  // cartouche, so this week's flag is never cropped.
  const FIRST = 90;
  const LAST = 1330;

  const max = $derived(Math.max(1, ...range.map((r) => r.n)));

  const hills = $derived.by(() => {
    const step = (LAST - FIRST) / Math.max(range.length - 1, 1);
    let d = `M -60 ${HILLS + 40} L -60 ${HILLS - 12}`;
    range.forEach((r, i) => {
      const x = FIRST + i * step;
      const h = 18 + 150 * Math.sqrt(r.n / max);
      const top = HILLS - h;
      // valley, shoulder, peak, shoulder: angular, like a carved line
      d += ` L ${x - step * 0.5} ${HILLS - 10}`;
      d += ` L ${x - step * 0.18} ${top + h * 0.35}`;
      d += ` L ${x - 6} ${top + 4} L ${x} ${top} L ${x + 9} ${top + 6}`;
      d += ` L ${x + step * 0.22} ${top + h * 0.42}`;
    });
    return `${d} L ${W + 60} ${HILLS - 10} L ${W + 60} ${HILLS + 40} Z`;
  });

  const peaks = $derived.by(() => {
    const step = (LAST - FIRST) / Math.max(range.length - 1, 1);
    return range.map((r, i) => ({ ...r, x: FIRST + i * step, y: HILLS - (18 + 150 * Math.sqrt(r.n / max)) }));
  });

  // Seigaiha: rows of overlapping wave scales, each lower row laid over the
  // one above it.
  const scales = (() => {
    const out: { x: number; y: number }[] = [];
    const sx = 44;
    const sy = 18;
    for (let row = 0, y = SEA + 14; y < H + 30; row++, y += sy) {
      for (let x = (row % 2) * (sx / 2) - sx; x < W + sx; x += sx) out.push({ x, y });
    }
    return out;
  })();
  const arc = (x: number, y: number, r: number) => `M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

  // The crest along the top of the sea: a row of breaking scallops.
  const crest = (() => {
    let d = `M 0 ${SEA}`;
    for (let x = 0; x < W; x += 36) d += ` q 9 -14 22 -6 q 6 4 14 6`;
    return d;
  })();

  const fmt = (start: string) =>
    new Date(`${start}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
</script>

<svg class="hero-print" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="hero-print-title">
  <title id="hero-print-title">
    A woodblock landscape. A snow-capped mountain under a graded blue sky, a range of hills in front
    of it with one peak for each of the last {range.length} weeks of work, and the sea below.
  </title>
  <defs>
    <linearGradient id="wb-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--wb-blue)" />
      <stop offset="0.12" stop-color="var(--wb-blue)" />
      <stop offset="0.5" stop-color="var(--wb-blue)" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="wb-mountain" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.15" stop-color="var(--wb-indigo)" />
      <stop offset="0.85" stop-color="var(--wb-blue-light)" />
    </linearGradient>
    <linearGradient id="wb-sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--wb-blue)" />
      <stop offset="1" stop-color="var(--wb-indigo)" />
    </linearGradient>
    <!-- Wood grain pulled through the sky block, and paper fibre over everything. -->
    <filter id="wb-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.42" numOctaves="2" seed="7" />
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.25" />
    </filter>
    <filter id="wb-fibre" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 0.95" />
    </filter>
    <clipPath id="wb-sea-clip"><rect x="0" y={SEA} width={W} height={H - SEA} /></clipPath>
  </defs>

  <rect width={W} height={H} fill="var(--wb-paper)" />

  <!-- sky: ichimonji bokashi, a hard band of blue grading out -->
  <rect width={W} height={H * 0.7} fill="url(#wb-sky)" />
  <rect width={W} height={H * 0.32} fill="var(--wb-key)" filter="url(#wb-grain)" opacity="0.14" />

  <!-- sun, or the moon after dark -->
  <circle class="hero-sun" cx="1110" cy="190" r="62" />

  <!-- the mountain -->
  <g transform="translate(2.5 1.5)">
    <path d="M 250 600 Q 520 330 612 152 L 676 152 Q 770 330 1060 600 Z" fill="url(#wb-mountain)" />
    <path
      d="M 612 152 L 676 152 L 716 228 L 698 216 L 686 246 L 668 222 L 652 262 L 636 228 L 618 252 L 604 222 L 586 240 L 572 226 Z"
      fill="var(--wb-snow)"
    />
  </g>
  <path class="key" d="M 250 600 Q 520 330 612 152 L 676 152 Q 770 330 1060 600" fill="none" />
  <path
    class="key key--thin"
    d="M 676 152 L 716 228 L 698 216 L 686 246 L 668 222 L 652 262 L 636 228 L 618 252 L 604 222 L 586 240 L 572 226 L 612 152"
    fill="none"
  />

  <!-- kasumi: bands of mist drawn across the middle distance -->
  <rect x="-40" y="452" width="640" height="34" rx="17" fill="var(--wb-mist)" />
  <rect x="980" y="430" width="700" height="28" rx="14" fill="var(--wb-mist)" />

  <!-- the range: sixteen weeks of work -->
  <path d={hills} fill="var(--wb-green)" transform="translate(2 1.5)" />
  <path d={hills} class="key" fill="none" />
  {#each peaks as p, i}
    {#if i === peaks.length - 1}
      <!-- this week, marked with a small red flag on its peak -->
      <g class="hero-flag" transform={`translate(${p.x} ${p.y})`}>
        <line x1="0" x2="0" y1="0" y2="-26" class="key key--thin" />
        <path d="M 0 -26 L 16 -21 L 0 -16 Z" fill="var(--wb-red)" />
      </g>
    {/if}
    <rect class="hero-peak-hit" x={p.x - 40} y={p.y} width="80" height={HILLS - p.y}>
      <title>Week of {fmt(p.start)}: {p.n} {p.n === 1 ? 'entry' : 'entries'} in the ledger</title>
    </rect>
  {/each}

  <rect x="-40" y="560" width="520" height="22" rx="11" fill="var(--wb-mist)" opacity="0.9" />
  <rect x="1180" y="572" width="460" height="20" rx="10" fill="var(--wb-mist)" opacity="0.9" />

  <!-- the sea -->
  <rect x="0" y={SEA} width={W} height={H - SEA} fill="url(#wb-sea)" />
  <g clip-path="url(#wb-sea-clip)">
    {#each scales as s}
      <path d={arc(s.x, s.y, 22)} class="scale" />
      <path d={arc(s.x, s.y, 15)} class="scale scale--in" />
      <path d={arc(s.x, s.y, 8)} class="scale scale--in" />
    {/each}
  </g>
  <path d={crest} class="crest" fill="none" />
  <line x1="0" x2={W} y1={SEA} y2={SEA} class="key" />

  <rect width={W} height={H} fill="var(--wb-key)" filter="url(#wb-fibre)" opacity="0.06" />
</svg>

<style>
  .hero-print {
    display: block;
    width: 100%;
    height: 100%;
  }

  .key {
    stroke: var(--wb-key);
    stroke-width: 2.4;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .key--thin {
    stroke-width: 1.5;
  }

  .hero-peak-hit {
    fill: transparent;
  }

  .hero-sun {
    fill: var(--wb-red);
  }

  .scale {
    fill: var(--wb-blue);
    stroke: var(--wb-blue-light);
    stroke-width: 1.4;
  }

  .scale--in {
    fill: none;
  }

  .crest {
    stroke: var(--wb-snow);
    stroke-width: 3;
    stroke-linecap: round;
  }
</style>
