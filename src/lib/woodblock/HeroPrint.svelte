<script lang="ts">
  // The front print, kept abstract: a graded sky, a large disc, and broad
  // planes of flat colour laid one over another the way blocks are printed in
  // turn. The nearest plane is data: a ridge through the last sixteen weeks,
  // as high as each week's work in the ledger, with this week marked in red.
  // Colour blocks sit a hair off the key block, the way a hand-registered
  // print does.

  let { range }: { range: { start: string; n: number }[] } = $props();

  const W = 1600;
  const H = 760;
  const RIDGE = 650;
  const SEA = 690;
  // The weeks run from just inside the left edge to just short of the
  // cartouche, so this week's mark is never cropped.
  const FIRST = 70;
  const LAST = 1320;

  const max = $derived(Math.max(1, ...range.map((r) => r.n)));

  const points = $derived.by(() => {
    const step = (LAST - FIRST) / Math.max(range.length - 1, 1);
    return range.map((r, i) => ({ ...r, x: FIRST + i * step, y: RIDGE - (24 + 150 * Math.sqrt(r.n / max)) }));
  });

  // A smooth line through the weeks (Catmull-Rom as cubic Béziers), carried
  // flat out to both edges.
  const ridgeLine = $derived.by(() => {
    if (!points.length) return '';
    const p = [{ x: -40, y: points[0].y }, ...points, { x: W + 40, y: points.at(-1)!.y }];
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(i - 1, 0)];
      const b = p[i];
      const c = p[i + 1];
      const e = p[Math.min(i + 2, p.length - 1)];
      d += ` C ${b.x + (c.x - a.x) / 6} ${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6} ${c.y - (e.y - b.y) / 6} ${c.x} ${c.y}`;
    }
    return d;
  });
  const ridge = $derived(`${ridgeLine} L ${W + 40} ${H} L -40 ${H} Z`);

  const now = $derived(points.at(-1));

  // Seigaiha along the foot of the print: rows of overlapping wave scales.
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

  const fmt = (start: string) =>
    new Date(`${start}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
</script>

<svg class="hero-print" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="hero-print-title">
  <title id="hero-print-title">
    An abstract woodblock print: a graded blue sky, a large disc, and broad planes of colour. The
    nearest plane is a ridge through the last {range.length} weeks of work, highest where the most
    got done.
  </title>
  <defs>
    <linearGradient id="wb-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--wb-blue)" />
      <stop offset="0.1" stop-color="var(--wb-blue)" />
      <stop offset="0.48" stop-color="var(--wb-blue)" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="wb-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--wb-blue-light)" />
      <stop offset="0.6" stop-color="var(--wb-blue)" />
    </linearGradient>
    <linearGradient id="wb-near" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--wb-green)" />
      <stop offset="1" stop-color="var(--wb-indigo)" stop-opacity="0.6" />
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
  <rect width={W} height={H * 0.3} fill="var(--wb-key)" filter="url(#wb-grain)" opacity="0.14" />

  <!-- the disc: sun by day, moon by night, half sunk behind the far plane -->
  <circle class="hero-sun" cx="1010" cy="330" r="150" />

  <!-- far plane: one long, slow swell -->
  <g transform="translate(3 1.5)">
    <path d="M -40 470 C 260 380 560 360 860 420 C 1120 470 1360 420 1640 360 L 1640 760 L -40 760 Z" fill="url(#wb-far)" />
  </g>
  <path class="key" d="M -40 470 C 260 380 560 360 860 420 C 1120 470 1360 420 1640 360" fill="none" />

  <!-- kasumi: a band of mist drawn straight across the disc and the swell -->
  <rect x="640" y="392" width="1040" height="30" rx="15" fill="var(--wb-mist)" />
  <rect x="-40" y="508" width="700" height="24" rx="12" fill="var(--wb-mist)" opacity="0.9" />

  <!-- middle plane: indigo, cut in a single stroke -->
  <g transform="translate(-2 2)">
    <path d="M -40 590 C 280 520 620 500 940 548 C 1220 590 1440 560 1640 520 L 1640 760 L -40 760 Z" fill="var(--wb-indigo)" />
  </g>
  <path class="key" d="M -40 590 C 280 520 620 500 940 548 C 1220 590 1440 560 1640 520" fill="none" />

  <!-- near plane: sixteen weeks of work -->
  <path d={ridge} fill="url(#wb-near)" transform="translate(2.5 1.5)" />
  <path d={ridgeLine} class="key" fill="none" />
  {#each points as p}
    <rect class="hero-week-hit" x={p.x - 40} y={p.y - 20} width="80" height={RIDGE - p.y + 20}>
      <title>Week of {fmt(p.start)}: {p.n} {p.n === 1 ? 'entry' : 'entries'} in the ledger</title>
    </rect>
  {/each}
  {#if now}
    <!-- this week -->
    <circle cx={now.x} cy={now.y} r="11" class="hero-now" />
  {/if}

  <!-- the sea along the foot -->
  <rect x="0" y={SEA} width={W} height={H - SEA} fill="url(#wb-sea)" />
  <g clip-path="url(#wb-sea-clip)">
    {#each scales as s}
      <path d={arc(s.x, s.y, 22)} class="scale" />
      <path d={arc(s.x, s.y, 15)} class="scale scale--in" />
      <path d={arc(s.x, s.y, 8)} class="scale scale--in" />
    {/each}
  </g>
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

  .hero-week-hit {
    fill: transparent;
  }

  .hero-sun {
    fill: var(--wb-red);
  }

  .hero-now {
    fill: var(--wb-red);
    stroke: var(--wb-key);
    stroke-width: 2;
  }

  .scale {
    fill: var(--wb-blue);
    stroke: var(--wb-blue-light);
    stroke-width: 1.4;
  }

  .scale--in {
    fill: none;
  }
</style>
