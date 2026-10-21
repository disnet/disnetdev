<script lang="ts">
  import { lensHref } from '$lib/lens/paths';

  let { data } = $props();

  const guide = $derived(data.guide);
  const repo = 'disnetdev.com';

  // dev.radl.v2.goalOp → "dev.radl.v2." and "goalOp"
  const split = (nsid: string) => {
    const i = nsid.lastIndexOf('.');
    return { ns: nsid.slice(0, i + 1), name: nsid.slice(i + 1) };
  };

  const monthYear = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

  const presence = (p: number) => (p >= 0.995 ? 'always' : p < 0.01 ? 'rare' : `${Math.round(p * 100)}%`);
  const count = (n: number | undefined, capped?: boolean) =>
    n === undefined ? '—' : `${n.toLocaleString()}${capped ? '+' : ''}`;
</script>

<svelte:head>
  <title>Field guide · disnetdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="proto-intro">
  <p class="page-eyebrow">prototype · field guide</p>
  <h1 class="page-heading">Field guide to my lexicons</h1>
  <p class="page-lede">
    The record types I've designed, drawn from the records themselves. Each plate shows a type's
    fields as they're actually written, and how far it has spread across the network.
  </p>
</section>

<nav class="fg-contents" aria-label="Families">
  {#each guide.families as family}
    <a href={`#${family.key}`}>
      <span class="fg-contents-name">{family.name}</span>
      <span class="fg-contents-plates">
        {#if family.specimens.length === 1}plate {family.specimens[0].plate}{:else}plates {family.specimens[0].plate}–{family.specimens.at(-1)?.plate}{/if}
      </span>
    </a>
  {/each}
</nav>

{#each guide.families as family (family.key)}
  <section class="fg-family" id={family.key} aria-labelledby={`${family.key}-name`}>
    <header class="fg-family-head">
      <h2 class="fg-family-name" id={`${family.key}-name`}>
        {#if family.home}<a href={family.home} rel="noopener">{family.name}</a>{:else}{family.name}{/if}
      </h2>
      <p class="fg-family-blurb">{family.blurb}</p>
      <p class="fg-family-meta">
        {family.namespaces.map((ns) => `${ns}.*`).join(' · ')} · {family.collections} collections in my repo
      </p>
    </header>

    <div class="fg-plates">
      {#each family.specimens as s (s.nsid)}
        {@const n = split(s.nsid)}
        <article class="fg-plate" aria-labelledby={`plate-${s.plate}`}>
          <p class="fg-plate-no">plate {s.plate}</p>
          <h3 class="fg-plate-name" id={`plate-${s.plate}`}>
            <a href={lensHref(repo, s.nsid)}><span class="fg-ns">{n.ns}</span>{n.name}</a>
          </h3>
          <p class="fg-plate-note">{s.note}</p>

          <table class="fg-fields">
            <thead>
              <tr><th scope="col">field</th><th scope="col">type</th><th scope="col">seen</th><th scope="col">e.g.</th></tr>
            </thead>
            <tbody>
              {#each s.fields as f}
                <tr class:is-nested={f.depth > 0}>
                  <th scope="row" class="fg-field-name">{#if f.depth}<span aria-hidden="true">└ </span>{/if}{f.name}</th>
                  <td class="fg-field-type">{f.type}</td>
                  <td class="fg-field-presence" class:is-always={f.presence >= 0.995}>{presence(f.presence)}</td>
                  <td class="fg-field-example">{f.example ?? ''}</td>
                </tr>
              {/each}
            </tbody>
          </table>

          <dl class="fg-stats">
            <div>
              <dt>in my repo</dt>
              <dd>{count(s.mine, s.mineCapped)}</dd>
            </div>
            <div>
              <dt>repos on the network</dt>
              <dd class="fg-stat-network">{count(s.network, s.networkCapped)}</dd>
            </div>
            <div>
              <dt>first written</dt>
              <dd>{monthYear(s.firstSeen)}</dd>
            </div>
          </dl>
        </article>
      {/each}
    </div>
  </section>
{/each}

<p class="fg-foot">
  Field shapes come from up to 50 of my newest records of each type. Network counts come from the
  relay's index of which repos hold a collection, counted and never listed.
</p>

<style>
  .fg-contents {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    border-top: 2px solid var(--ink-text);
    margin-bottom: var(--space-2xl);
  }

  .fg-contents a {
    display: flex;
    justify-content: space-between;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm) var(--space-xs) 0;
    border-bottom: var(--rule) solid var(--ink-rule-soft);
    text-decoration: none;
    color: var(--ink-text);
  }

  .fg-contents a:hover .fg-contents-name {
    color: var(--ink-accent);
  }

  .fg-contents-name {
    font-family: var(--font-display);
    font-weight: 620;
    font-size: var(--type-sm);
  }

  .fg-contents-plates {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  .fg-family {
    margin-bottom: var(--space-3xl);
    scroll-margin-top: var(--space-lg);
  }

  .fg-family-head {
    border-top: 2px solid var(--ink-text);
    padding-top: var(--space-sm);
    margin-bottom: var(--space-lg);
    max-width: var(--measure);
  }

  .fg-family-name {
    margin: 0;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-h2);
    letter-spacing: -0.015em;
  }

  .fg-family-name a {
    color: inherit;
    text-decoration: none;
  }

  .fg-family-name a:hover {
    color: var(--ink-accent);
  }

  .fg-family-blurb {
    margin: var(--space-2xs) 0 0;
    color: var(--ink-text-soft);
  }

  .fg-family-meta {
    margin: var(--space-2xs) 0 0;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  .fg-plates {
    display: grid;
    align-items: start;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-lg);
  }

  @media (min-width: 64rem) {
    .fg-plates {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* A plate: a framed specimen, numbered in the corner like a book of
   * engravings. */
  .fg-plate {
    position: relative;
    border: var(--rule) solid var(--ink-rule);
    padding: var(--space-md) var(--space-md) var(--space-sm);
    background: var(--ink-page);
  }

  .fg-plate-no {
    position: absolute;
    top: 0;
    right: 0;
    margin: 0;
    padding: 0.25rem 0.55rem;
    background: var(--ink-text);
    color: var(--ink-page);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .fg-plate-name {
    margin: 0;
    padding-right: 5rem;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-xl);
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .fg-plate-name a {
    color: var(--ink-text);
    text-decoration: none;
  }

  .fg-plate-name a:hover {
    color: var(--ink-accent);
  }

  .fg-ns {
    display: block;
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: var(--type-xs);
    color: var(--ink-muted);
    letter-spacing: 0;
  }

  .fg-plate-note {
    margin: var(--space-2xs) 0 var(--space-sm);
    color: var(--ink-text-soft);
    font-size: 1.05rem;
    line-height: 1.5;
  }

  .fg-fields {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
  }

  .fg-fields thead th {
    text-align: left;
    font-weight: 400;
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0 0 0.35rem;
    border-bottom: 2px solid var(--ink-text);
  }

  .fg-fields thead th:nth-child(1) { width: 30%; }
  .fg-fields thead th:nth-child(2) { width: 22%; }
  .fg-fields thead th:nth-child(3) { width: 13%; }

  .fg-fields td,
  .fg-fields tbody th {
    padding: 0.4rem 0.5rem 0.4rem 0;
    border-bottom: var(--rule) solid var(--ink-rule-soft);
    text-align: left;
    vertical-align: baseline;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fg-field-name {
    font-weight: 500;
    color: var(--ink-text);
  }

  .is-nested .fg-field-name {
    padding-left: 0.6rem;
    font-weight: 400;
    color: var(--ink-text-soft);
  }

  .fg-field-type {
    color: var(--ink-text-soft);
  }

  .fg-field-presence {
    color: var(--ink-muted);
  }

  .fg-field-presence.is-always {
    color: var(--ink-accent);
  }

  .fg-field-example {
    color: var(--ink-muted);
  }

  .fg-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-sm);
    margin: var(--space-md) 0 0;
  }

  .fg-stats div {
    border-top: var(--rule) solid var(--ink-rule);
    padding-top: var(--space-2xs);
  }

  .fg-stats dt {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  .fg-stats dd {
    margin: 0.15rem 0 0;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-xl);
    font-variant-numeric: tabular-nums;
  }

  .fg-stat-network {
    color: var(--ink-accent);
  }

  @media (max-width: 40rem) {
    .fg-plate {
      padding: var(--space-sm);
    }

    .fg-fields thead th:nth-child(1) { width: 42%; }
    .fg-fields thead th:nth-child(2) { width: 34%; }
    .fg-fields thead th:nth-child(3) { width: 24%; }

    .fg-fields th:nth-child(4),
    .fg-fields td:nth-child(4) {
      display: none;
    }

    .fg-stats dd {
      font-size: var(--type-lg);
    }
  }

  .fg-foot {
    max-width: var(--measure);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }
</style>
