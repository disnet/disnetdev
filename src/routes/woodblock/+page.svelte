<script lang="ts">
  import '@fontsource/shippori-mincho/400.css';
  import '@fontsource/shippori-mincho/700.css';
  import '@fontsource/shippori-mincho/800.css';
  import HeroPrint from '$lib/woodblock/HeroPrint.svelte';
  import WavePrint from '$lib/woodblock/WavePrint.svelte';

  let { data } = $props();

  const nav = [
    { href: '/blog', label: 'writing' },
    { href: '/reading', label: 'reading' },
    { href: '/photos', label: 'photos' },
    { href: '/papers', label: 'papers' },
    { href: '/made', label: 'workbench' }
  ];

  const socials = [
    { label: 'Bluesky', handle: '@disnetdev.com', href: 'https://bsky.app/profile/disnetdev.com' },
    { label: 'Mastodon', handle: '@disnet@mastodon.social', href: 'https://mastodon.social/@disnet' },
    { label: 'GitHub', handle: '@disnet', href: 'https://github.com/disnet' },
    { label: 'Email', handle: 'tim@disnetdev.com', href: 'mailto:tim@disnetdev.com' }
  ];

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const short = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  const VERB = { finished: 'finished', merged: 'merged', started: 'started' } as Record<string, string>;
</script>

<svelte:head>
  <title>Thirty-six Views of the Atmosphere · disnetdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="wb">
  <header class="wb-mast">
    <a class="wb-mark" href="/woodblock">
      <span class="wb-mark-seal" aria-hidden="true">迪</span>
      disnetdev
    </a>
    <nav class="wb-nav" aria-label="Primary">
      {#each nav as item}<a href={item.href}>{item.label}</a>{/each}
    </nav>
  </header>

  <main>
    <section class="wb-hero" aria-labelledby="wb-name">
      <figure class="wb-frame wb-frame--hero">
        <div class="wb-hero-art">
          <HeroPrint range={data.range} />
          <div class="wb-cartouche" lang="ja">
            <span class="wb-cartouche-title">大気三十六景</span>
            <span class="wb-cartouche-en" lang="en">Thirty-six Views of the Atmosphere</span>
          </div>
        </div>
        <figcaption class="wb-hero-caption">
          The hills are my last {data.range.length} weeks of work, one peak a week, read from the
          <a href="/made">ledger</a>. The flag is this week.
        </figcaption>
      </figure>

      <div class="wb-intro">
        <h1 class="wb-name" id="wb-name">Tim Disney</h1>
        <p class="wb-lede">
          I make code and things. Programming languages, the web, and the
          <a href="https://atproto.com/">Atmosphere</a> bring me joy.
        </p>
        <ul class="wb-socials" aria-label="Reach me">
          {#each socials as s}
            <li>
              <span class="wb-social-label">{s.label}</span>
              <a href={s.href} rel={s.label === 'Bluesky' || s.label === 'Mastodon' ? 'me' : undefined}>{s.handle}</a>
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <div class="wb-series">
      <section class="wb-print wb-print--writing" aria-labelledby="wb-writing">
        <header class="wb-label">
          <span class="wb-label-no" lang="ja" aria-hidden="true">一</span>
          <h2 id="wb-writing">Writing</h2>
        </header>
        <ol class="wb-posts">
          {#each data.posts as post}
            <li>
              <time class="wb-meta" datetime={post.publishedAt}>{date(post.publishedAt)}</time>
              <h3 class="wb-post-title"><a href={post.path}>{post.title}</a></h3>
              {#if post.description}<p class="wb-post-desc">{post.description}</p>{/if}
            </li>
          {/each}
        </ol>
        <a class="wb-more" href="/blog">every post →</a>
      </section>

      <section class="wb-print wb-print--work" aria-labelledby="wb-work">
        <header class="wb-label">
          <span class="wb-label-no" lang="ja" aria-hidden="true">二</span>
          <h2 id="wb-work">On the workbench</h2>
        </header>
        <ol class="wb-work">
          {#each data.work as e (e.id)}
            <li>
              <span class="wb-meta">{short(e.at)} · {VERB[e.kind]}</span>
              <a href={e.href}>{e.title}</a>
              <span class="wb-work-project">{e.project}</span>
            </li>
          {/each}
        </ol>
        <a class="wb-more" href="/made">the whole ledger →</a>
      </section>

      {#if data.families.length}
        <section class="wb-print wb-print--waves" aria-labelledby="wb-waves">
          <header class="wb-label">
            <span class="wb-label-no" lang="ja" aria-hidden="true">三</span>
            <h2 id="wb-waves">Lexicons at sea</h2>
          </header>
          <p class="wb-print-note">
            Record types I've designed. Each wave is as tall as the number of repos on the network
            that carry it.
          </p>
          <div class="wb-waves-art">
            <WavePrint families={data.families} />
          </div>
          <ol class="wb-waves-legend" style:--n={data.families.length}>
            {#each data.families as f}
              <li>
                <a href={`/lexicons#${f.key}`}>{f.name}</a>
                <span class="wb-meta">{f.repos.toLocaleString()} {f.repos === 1 ? 'repo' : 'repos'}</span>
              </li>
            {/each}
          </ol>
        </section>
      {/if}

      {#if data.photos.length}
        <section class="wb-print wb-print--photos" aria-labelledby="wb-photos">
          <header class="wb-label">
            <span class="wb-label-no" lang="ja" aria-hidden="true">四</span>
            <h2 id="wb-photos">Seen lately</h2>
          </header>
          <ul class="wb-photos">
            {#each data.photos as photo}
              {@const image = photo.images[0]}
              {#if image}
                <li>
                  <a href={photo.url} class="wb-photo">
                    <img src={image.thumb} alt={image.alt || photo.text} loading="lazy" />
                  </a>
                  <span class="wb-meta">{short(photo.createdAt)}</span>
                </li>
              {/if}
            {/each}
          </ul>
          <a class="wb-more" href="/photos">all photos →</a>
        </section>
      {/if}
    </div>
  </main>

  <footer class="wb-foot">
    <span class="wb-mark-seal wb-mark-seal--small" aria-hidden="true">迪</span>
    <span>
      Printed from the records in my repo. A prototype; the
      <a href="/">blue pencil site</a> is still the real one.
    </span>
  </footer>
</div>

<style>
  /* ——— palette: a day print, and a night print after dark ———
   * Washi paper, sumi key block, bero-ai (Prussian blue), indigo, vermilion
   * for seals and the sun. Everything else is paper and ink.
   */
  .wb {
    --wb-paper: oklch(0.945 0.022 85);
    --wb-ground: oklch(0.905 0.028 80);
    --wb-ink: oklch(0.24 0.02 260);
    --wb-ink-soft: oklch(0.42 0.02 260);
    --wb-key: oklch(0.22 0.02 260);
    --wb-blue: oklch(0.45 0.11 252);
    --wb-blue-light: oklch(0.72 0.07 238);
    --wb-indigo: oklch(0.3 0.07 262);
    --wb-red: oklch(0.6 0.19 33);
    --wb-green: oklch(0.64 0.07 145);
    --wb-snow: oklch(0.975 0.01 85);
    --wb-mist: oklch(0.93 0.035 60);
    --wb-serif: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;

    min-height: 100vh;
    background: var(--wb-ground);
    color: var(--wb-ink);
    font-family: var(--wb-serif);
    font-feature-settings: 'palt';
    font-stretch: normal;
  }

  @media (prefers-color-scheme: dark) {
    .wb {
      --wb-paper: oklch(0.225 0.03 262);
      --wb-ground: oklch(0.175 0.028 262);
      --wb-ink: oklch(0.92 0.02 85);
      --wb-ink-soft: oklch(0.76 0.02 85);
      --wb-key: oklch(0.11 0.02 262);
      --wb-blue: oklch(0.34 0.09 256);
      --wb-blue-light: oklch(0.52 0.08 245);
      --wb-indigo: oklch(0.17 0.045 262);
      --wb-red: oklch(0.9 0.06 92);
      --wb-green: oklch(0.36 0.05 160);
      --wb-snow: oklch(0.86 0.02 240);
      --wb-mist: oklch(0.3 0.035 258);
    }

    /* The seals stay vermilion at night; only the sun turns into the moon. */
    .wb-mark-seal,
    .wb-label-no {
      background: oklch(0.58 0.17 33) !important;
    }

    .wb-cartouche,
    .wb-label {
      border-color: oklch(0.58 0.17 33) !important;
    }
  }

  .wb a {
    color: inherit;
    text-decoration-color: var(--wb-red);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 0.2em;
  }

  .wb a:hover {
    color: var(--wb-blue);
  }

  @media (prefers-color-scheme: dark) {
    .wb a:hover {
      color: var(--wb-blue-light);
    }
  }

  .wb-meta {
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--wb-ink-soft);
  }

  /* ——— masthead ——— */

  .wb-mast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    max-width: 82rem;
    margin: 0 auto;
    padding: 1.25rem clamp(1rem, 4vw, 2.5rem);
  }

  .wb-mark {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 800;
    font-size: 1.4rem;
    text-decoration: none;
  }

  .wb-mark-seal {
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    background: var(--wb-red);
    color: var(--wb-snow);
    font-weight: 800;
    font-size: 1.15rem;
    border-radius: 3px;
    /* A seal never lands perfectly square. */
    transform: rotate(-3deg);
  }

  .wb-mark-seal--small {
    flex-shrink: 0;
    width: 1.4rem;
    height: 1.4rem;
    font-size: 0.8rem;
  }

  .wb-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
    font-size: 1rem;
  }

  .wb-nav a {
    text-decoration: none;
  }

  /* ——— hero ——— */

  main {
    max-width: 82rem;
    margin: 0 auto;
    padding: 0 clamp(1rem, 4vw, 2.5rem) 4rem;
  }

  /* A print in its mount: a heavy key line, a hairline outside it. */
  .wb-frame {
    position: relative;
    margin: 0;
    border: 2px solid var(--wb-key);
    outline: 1px solid var(--wb-key);
    outline-offset: 6px;
    background: var(--wb-paper);
  }

  .wb-hero-art {
    position: relative;
    height: clamp(360px, 46vw, 640px);
    overflow: hidden;
  }

  .wb-cartouche {
    position: absolute;
    top: clamp(0.75rem, 3vw, 2rem);
    right: clamp(0.75rem, 3vw, 2rem);
    display: flex;
    flex-direction: row-reverse;
    gap: 0.4rem;
    padding: 0.8rem 0.55rem;
    writing-mode: vertical-rl;
    background: var(--wb-mist);
    border: 4px double var(--wb-red);
    color: var(--wb-key);
  }

  @media (prefers-color-scheme: dark) {
    .wb-cartouche {
      color: var(--wb-ink);
    }
  }

  .wb-cartouche-title {
    font-weight: 800;
    font-size: clamp(1.25rem, 2.6vw, 2rem);
    letter-spacing: 0.12em;
  }

  .wb-cartouche-en {
    font-size: clamp(0.7rem, 1vw, 0.85rem);
    letter-spacing: 0.08em;
  }

  @media (max-width: 40rem) {
    .wb-cartouche-en {
      display: none;
    }
  }

  .wb-hero-caption {
    padding: 0.6rem 1rem 0.7rem;
    border-top: 2px solid var(--wb-key);
    font-size: 0.9rem;
    color: var(--wb-ink-soft);
  }

  .wb-intro {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem 3rem;
    margin: 3rem 0 4rem;
  }

  .wb-name {
    margin: 0;
    font-weight: 800;
    font-size: clamp(3rem, 2rem + 5vw, 6rem);
    line-height: 0.95;
    letter-spacing: -0.02em;
  }

  .wb-lede {
    margin: 0;
    max-width: 34ch;
    font-size: clamp(1.2rem, 1rem + 0.6vw, 1.5rem);
    line-height: 1.55;
  }

  .wb-socials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.75rem 1.5rem;
    list-style: none;
    margin: 0;
    padding: 1rem 0 0;
    border-top: 1px solid var(--wb-key);
  }

  .wb-socials li {
    display: grid;
  }

  .wb-social-label {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--wb-ink-soft);
  }

  @media (min-width: 64rem) {
    .wb-intro {
      grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
      align-items: end;
    }

    .wb-socials {
      grid-column: 1 / -1;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  /* ——— the series: each section is a print with its title in a cartouche ——— */

  .wb-series {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 3.5rem 2.5rem;
  }

  @media (min-width: 64rem) {
    .wb-series {
      grid-template-columns: repeat(12, minmax(0, 1fr));
    }

    .wb-print--writing {
      grid-column: 1 / span 7;
    }

    .wb-print--work {
      grid-column: 8 / span 5;
    }

    .wb-print--waves {
      grid-column: 1 / -1;
    }

    .wb-print--photos {
      grid-column: 1 / -1;
    }
  }

  .wb-print {
    position: relative;
    padding: 2.75rem clamp(1rem, 3vw, 2rem) 1.5rem;
    background: var(--wb-paper);
    border: 2px solid var(--wb-key);
    outline: 1px solid var(--wb-key);
    outline-offset: 6px;
  }

  .wb-label {
    position: absolute;
    top: -1.35rem;
    left: clamp(1rem, 3vw, 2rem);
    display: flex;
    align-items: stretch;
    background: var(--wb-mist);
    border: 4px double var(--wb-red);
  }

  .wb-label-no {
    display: grid;
    place-items: center;
    padding: 0 0.55rem;
    background: var(--wb-red);
    color: var(--wb-snow);
    font-weight: 800;
    font-size: 1.1rem;
  }

  .wb-label h2 {
    margin: 0;
    padding: 0.3rem 0.85rem 0.35rem;
    font-weight: 800;
    font-size: 1.3rem;
    letter-spacing: 0.02em;
    color: var(--wb-key);
  }

  @media (prefers-color-scheme: dark) {
    .wb-label h2 {
      color: var(--wb-ink);
    }
  }

  .wb-print-note {
    margin: 0 0 1rem;
    max-width: 52ch;
    color: var(--wb-ink-soft);
  }

  .wb-more {
    display: inline-block;
    margin-top: 1rem;
    font-size: 0.95rem;
  }

  /* writing */
  .wb-posts {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .wb-posts li {
    padding: 1rem 0;
    border-bottom: 1px solid color-mix(in oklch, var(--wb-key) 25%, transparent);
  }

  .wb-posts li:first-child {
    padding-top: 0;
  }

  .wb-post-title {
    margin: 0.2rem 0 0;
    font-weight: 800;
    font-size: clamp(1.4rem, 1.1rem + 1vw, 2rem);
    line-height: 1.2;
  }

  .wb-post-title a {
    text-decoration: none;
  }

  .wb-post-desc {
    margin: 0.35rem 0 0;
    color: var(--wb-ink-soft);
    font-size: 1.05rem;
  }

  /* workbench */
  .wb-work {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .wb-work li {
    display: grid;
    gap: 0.15rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid color-mix(in oklch, var(--wb-key) 25%, transparent);
    font-size: 1.05rem;
    line-height: 1.4;
  }

  .wb-work li:first-child {
    padding-top: 0;
  }

  .wb-work a {
    font-weight: 700;
    text-decoration: none;
  }

  .wb-work-project {
    font-size: 0.9rem;
    color: var(--wb-ink-soft);
  }

  /* waves */
  .wb-waves-art {
    border: 2px solid var(--wb-key);
  }

  .wb-waves-legend {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 0.5rem;
    list-style: none;
    margin: 0.75rem 0 0;
    padding: 0;
    text-align: center;
  }

  .wb-waves-legend li {
    display: grid;
    gap: 0.1rem;
  }

  .wb-waves-legend a {
    font-weight: 700;
    text-decoration: none;
    line-height: 1.25;
  }

  @media (max-width: 40rem) {
    .wb-waves-legend {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      text-align: left;
    }
  }

  /* photos */
  .wb-photos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .wb-photos li {
    display: grid;
    gap: 0.4rem;
  }

  .wb-photo {
    display: block;
    padding: 0.5rem;
    border: 2px solid var(--wb-key);
    background: var(--wb-snow);
  }

  .wb-photo img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  /* ——— footer ——— */

  .wb-foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 2rem 1rem 3rem;
    font-size: 0.95rem;
    color: var(--wb-ink-soft);
    text-align: center;
  }
</style>
