<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import LedgerRows from '$lib/components/ledger/LedgerRows.svelte';
  import type { LedgerKind } from '$lib/ledger';

  let { data } = $props();

  const ledger = $derived(data.ledger);
  let project = $state<string | null>(page.url.searchParams.get('p'));

  const weeks = $derived(
    ledger.weeks
      .map((w) => ({ ...w, entries: project ? w.entries.filter((e) => e.project === project) : w.entries }))
      .filter((w) => w.entries.length)
  );

  function choose(name: string | null) {
    project = project === name ? null : name;
    const url = new URL(page.url);
    if (project) url.searchParams.set('p', project);
    else url.searchParams.delete('p');
    replaceState(url, {});
  }

  const PLURAL: Record<LedgerKind, string> = {
    finished: 'finished',
    started: 'started',
    noted: 'notes',
    merged: 'merged',
    published: 'published',
    opened: 'new repos'
  };

  const weekLabel = (start: string) =>
    new Date(`${start}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  const year = (start: string) => start.slice(0, 4);
</script>

<svelte:head>
  <title>Made in public · disnetdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="proto-intro">
  <p class="page-eyebrow">prototype · the colophon</p>
  <h1 class="page-heading">Made in public</h1>
  <p class="page-lede">
    What I've been building, week by week. Every line is a record the work left in my repo: goals
    in atplan and Radial, notes from the agents doing the work, PRs merged on Tangled, and posts.
  </p>
</section>

<nav class="made-projects" aria-label="Projects">
  <span class="made-projects-label">{ledger.total} entries since {new Date(ledger.since).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
  <button type="button" class="made-project" class:is-on={!project} onclick={() => choose(null)}>everything</button>
  {#each ledger.projects as p}
    <button type="button" class="made-project" class:is-on={project === p.name} onclick={() => choose(p.name)}>
      {p.name}<span class="made-project-n">{p.n}</span>
    </button>
  {/each}
</nav>

{#each weeks as week (week.start)}
  <section class="made-week" aria-label={`Week of ${weekLabel(week.start)}`}>
    <header class="made-week-head">
      <h2 class="made-week-title">
        <span class="made-week-of">week of</span>
        {weekLabel(week.start)}<span class="made-week-year">, {year(week.start)}</span>
      </h2>
      <p class="made-week-tally">
        {#each week.tally as t, i}{#if i}{' · '}{/if}{t.n} {PLURAL[t.kind]}{/each}
      </p>
    </header>
    <LedgerRows entries={week.entries} />
  </section>
{/each}

<p class="made-foot">
  The ledger reads my repo every few minutes. Each title links to the record behind it.
</p>

<style>
  .made-projects {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-3xs) var(--space-sm);
    padding: var(--space-xs) 0;
    border-top: 2px solid var(--ink-text);
    border-bottom: var(--rule) solid var(--ink-rule);
    margin-bottom: var(--space-xl);
  }

  .made-projects-label {
    flex-basis: 100%;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    margin-bottom: var(--space-3xs);
  }

  .made-project {
    font-family: var(--font-display);
    font-weight: 560;
    font-size: var(--type-sm);
    color: var(--ink-text-soft);
    background: none;
    border: 0;
    padding: 0.15em 0;
    cursor: pointer;
  }

  .made-project:hover {
    color: var(--ink-accent);
  }

  .made-project.is-on {
    color: var(--ink-text);
    text-decoration: underline 2px var(--ink-accent);
    text-underline-offset: 0.3em;
  }

  .made-project-n {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    margin-left: 0.35em;
  }

  .made-week {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-xs);
    margin-bottom: var(--space-xl);
    max-width: var(--measure-wide);
  }

  .made-week-head {
    border-top: 2px solid var(--ink-text);
    padding-top: var(--space-xs);
  }

  .made-week-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--type-h3);
    letter-spacing: -0.01em;
  }

  .made-week-of {
    display: block;
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: var(--type-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  .made-week-year {
    color: var(--ink-muted);
    font-weight: 500;
  }

  .made-week-tally {
    margin: var(--space-3xs) 0 0;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  @media (min-width: 56rem) {
    .made-week {
      grid-template-columns: 13rem minmax(0, 1fr);
      gap: var(--space-lg);
    }

    .made-week-head {
      align-self: start;
      position: sticky;
      top: var(--space-md);
    }
  }

  .made-foot {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }
</style>
