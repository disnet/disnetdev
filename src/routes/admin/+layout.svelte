<script lang="ts">
  import '@fontsource-variable/vollkorn/wght.css';
  import '@fontsource-variable/vollkorn/wght-italic.css';
  import '@fontsource-variable/literata/opsz.css';
  import '@fontsource-variable/literata/opsz-italic.css';
  import '@fontsource/fragment-mono/400.css';
  import '@fontsource/fragment-mono/400-italic.css';
  import './studio.css';

  import { page } from '$app/state';

  let { children } = $props();

  const isDashboard = $derived(page.url.pathname === '/admin');
</script>

<svelte:head>
  <meta name="color-scheme" content="light" />
  <title>studio — disnetdev</title>
</svelte:head>

<div class="studio">
  <header class="studio-header">
    <a class="studio-mark" href="/admin" aria-label="Studio home">
      <span class="studio-mark-name">disnetdev</span>
      <span class="studio-mark-sep">/</span>
      <span class="studio-mark-label">studio</span>
    </a>
    <nav class="studio-nav" aria-label="Admin">
      <a href="/" class="studio-nav-link">back to site</a>
      <form method="POST" action="/auth/logout" class="studio-nav-signout">
        <button type="submit" class="studio-nav-link">sign out</button>
      </form>
    </nav>
  </header>

  <main class="studio-main" class:studio-main--narrow={!isDashboard}>
    {@render children?.()}
  </main>
</div>
