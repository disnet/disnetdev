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
  import HandleField from '$lib/components/HandleField.svelte';

  let { children, data } = $props();

  const nav = [
    { href: '/', label: 'index', match: (p: string) => p === '/' },
    { href: '/blog', label: 'blog', match: (p: string) => p === '/blog' },
    {
      href: '/reading',
      label: 'reading',
      match: (p: string) => p.startsWith('/reading')
    },
    {
      href: '/photos',
      label: 'photos',
      match: (p: string) => p.startsWith('/photos')
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
  const subscribed = $derived(Boolean(data?.subscribed));

  // Native <details> stays open on outside clicks — dismiss it ourselves.
  let subscribeEl = $state<HTMLDetailsElement>();
  $effect(() => {
    function onPointerDown(event: MouseEvent) {
      if (subscribeEl?.open && !subscribeEl.contains(event.target as Node)) {
        subscribeEl.open = false;
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && subscribeEl?.open) {
        subscribeEl.open = false;
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<svelte:head>
  <meta name="color-scheme" content="light dark" />
  <link rel="alternate" type="application/rss+xml" title="disnetdev RSS" href="/feed.xml" />
  {#if data.authorDid}
    <meta name="at:me" content={`at://${data.authorDid}`} />
  {/if}
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

        <details class="subscribe" class:is-subscribed={subscribed} bind:this={subscribeEl}>
          <summary class="subscribe-summary">
            {#if subscribed}<span class="subscribe-check" aria-hidden="true">▸</span
              >subscribed{:else}subscribe{/if}
          </summary>
          <div class="subscribe-popover">
            {#if subscribed}
              <p class="subscribe-status">
                <span class="subscribe-check" aria-hidden="true">▸</span> Following over ATProto.
              </p>
              <form class="subscribe-unsub" method="POST" action="/subscribe?/unsubscribe">
                <input type="hidden" name="redirectTo" value={pathname} />
                <button type="submit" class="subscribe-unsub-button">unsubscribe</button>
              </form>
            {:else}
              <form class="subscribe-mini" method="POST" action="/subscribe?/subscribe">
                <input type="hidden" name="redirectTo" value={pathname} />
                <label class="subscribe-mini-label" for="masthead-handle">
                  Subscribe with your Atmosphere Account
                </label>
                <div class="subscribe-mini-row">
                  <HandleField id="masthead-handle" placeholder="you.bsky.social" />
                  <button type="submit" aria-label="Subscribe with your Atmosphere account">▸</button>
                </div>
              </form>
            {/if}
            <a class="subscribe-rss" href="/feed.xml">
              <span class="subscribe-rss-glyph" aria-hidden="true">▸</span> rss feed
            </a>
          </div>
        </details>
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
