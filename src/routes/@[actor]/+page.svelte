<script lang="ts">
  import { lensHref } from '$lib/lens/paths';
  import { shortName } from '$lib/lens/apps';

  let { data } = $props();

  const identity = $derived(data.identity);
  const shown = $derived(data.groups.reduce((n, g) => n + g.collections.length, 0));
  const DRAWER_LIMIT = 12;
  const name = $derived(data.profile.displayName || identity.handle);
</script>

<svelte:head>
  <title>{name} · through the lens · disnetdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="lens-intro">
  <p class="page-eyebrow">lens</p>
  <div class="lens-who">
    {#if data.profile.avatarUrl}
      <img class="lens-avatar" src={data.profile.avatarUrl} alt="" width="56" height="56" />
    {/if}
    <div>
      <h1 class="page-heading">{name}</h1>
      <p class="lens-handle">
        @{identity.handle}{#if !identity.handleIsCorrect}<span class="lens-warn"> (unverified)</span>{/if}
      </p>
    </div>
  </div>
  {#if data.profile.description}
    <p class="page-lede">{data.profile.description}</p>
  {/if}

  <p class="lens-status">
    <span class="lens-prompt">$</span>
    <span>at://{identity.did}</span>
    <span class="lens-sep">·</span>
    <span>{new URL(identity.pds).host}</span>
    <span class="lens-sep">·</span>
    <span>{shown} collections across {data.groups.length} apps</span>
  </p>

  <form class="lens-aim" method="GET" action="/lens">
    <label for="lens-actor">Point the lens at another repo</label>
    <div class="lens-aim-row">
      <input id="lens-actor" name="actor" placeholder="you.bsky.social" autocomplete="off" spellcheck="false" />
      <button type="submit" aria-label="Look">▸</button>
    </div>
  </form>
</section>

{#snippet drawerList(nsids: string[])}
  <ul class="lens-drawer-list">
    {#each nsids as nsid}
      <li>
        <a href={lensHref(identity.handle || identity.did, nsid)} title={nsid}>
          {shortName(nsid) || nsid}
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="lens-cabinet">
  {#each data.groups as group}
    <section class="lens-drawer" aria-labelledby={`app-${group.key}`}>
      <header class="lens-drawer-header">
        <h2 id={`app-${group.key}`} class="lens-drawer-title">
          {#if group.home}<a href={group.home} rel="noopener">{group.name}</a>{:else}{group.name}{/if}
        </h2>
        <span class="lens-drawer-count">{group.collections.length}</span>
      </header>
      {@render drawerList(group.collections.slice(0, DRAWER_LIMIT))}
      {#if group.collections.length > DRAWER_LIMIT}
        <details class="lens-drawer-more">
          <summary>{group.collections.length - DRAWER_LIMIT} more</summary>
          {@render drawerList(group.collections.slice(DRAWER_LIMIT))}
        </details>
      {/if}
    </section>
  {/each}
</div>
