<script lang="ts">
  const nav = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/archive', label: 'Archive' },
    { href: '/admin', label: 'Admin' }
  ];
</script>

<svelte:head>
  <meta name="color-scheme" content="dark light" />
</svelte:head>

<div class="shell">
  <header>
    <a class="brand" href="/">disnetdev</a>
    <nav>
      {#each nav as item}
        <a href={item.href}>{item.label}</a>
      {/each}
    </nav>
  </header>

  <main>
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    background: #0b1020;
    color: #e5ecff;
  }

  :global(a) {
    color: inherit;
  }

  .shell {
    min-height: 100vh;
    padding: 2rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    max-width: 64rem;
    margin: 0 auto 3rem;
  }

  nav {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .brand {
    font-weight: 700;
    text-decoration: none;
  }

  main {
    max-width: 64rem;
    margin: 0 auto;
  }
</style>
