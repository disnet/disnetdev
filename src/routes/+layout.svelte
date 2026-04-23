<script lang="ts">
  import '@fontsource-variable/alegreya/wght.css';
  import '@fontsource-variable/alegreya/wght-italic.css';
  import '@fontsource/young-serif/400.css';
  import '@fontsource/alegreya-sans-sc/500.css';
  import '@fontsource/commit-mono/400.css';
  import '@fontsource/commit-mono/400-italic.css';
  import '@fontsource/commit-mono/500.css';
  import './cathode.css';

  import { page } from '$app/state';

  let { children } = $props();

  const nav = [
    { href: '/', label: 'index', match: (p: string) => p === '/' },
    { href: '/blog', label: 'blog', match: (p: string) => p === '/blog' },
    {
      href: '/reading',
      label: 'reading',
      match: (p: string) => p.startsWith('/reading')
    },
    {
      href: '/library',
      label: 'library',
      match: (p: string) => p.startsWith('/library')
    },
    {
      href: '/papers',
      label: 'papers',
      match: (p: string) => p.startsWith('/papers')
    }
  ];

  // The admin area owns its own viewport chrome (src/routes/admin/+layout.svelte).
  const isAdminArea = $derived(page.url.pathname.startsWith('/admin'));
  const pathname = $derived(page.url.pathname);
</script>

<svelte:head>
  <meta name="color-scheme" content="light dark" />
  <link rel="alternate" type="application/rss+xml" title="disnetdev RSS" href="/feed.xml" />
</svelte:head>

{#if isAdminArea}
  {@render children?.()}
{:else}
  <div class="cathode">
    <header class="masthead">
      <a class="masthead-mark" href="/" aria-label="disnetdev, home">
        disnetdev<span class="masthead-mark-dot">.</span>
      </a>
      <nav class="masthead-nav" aria-label="Primary">
        {#each nav as item}
          <a
            href={item.href}
            aria-current={item.match(pathname) ? 'page' : undefined}>
            {item.label}
          </a>
        {/each}
      </nav>
    </header>

    <main class="cathode-main">
      {@render children?.()}
    </main>

    <footer class="colophon">
      <div>
        <span class="colophon-prompt">$</span>
        disnetdev — a language workshop, since 2011
      </div>
      <div class="colophon-links">
        <a href="/feed.xml">rss</a>
        <span class="colophon-sep" aria-hidden="true">·</span>
        <a href="/admin">studio</a>
      </div>
    </footer>
  </div>
{/if}
