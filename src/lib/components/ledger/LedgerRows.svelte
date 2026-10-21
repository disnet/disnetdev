<script lang="ts">
  import type { LedgerEntry, LedgerKind } from '$lib/ledger';

  let { entries, compact = false }: { entries: LedgerEntry[]; compact?: boolean } = $props();

  const VERB: Record<LedgerKind, string> = {
    finished: 'finished',
    started: 'started',
    noted: 'noted',
    merged: 'merged',
    published: 'published',
    opened: 'opened'
  };

  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
</script>

<ol class="ledger-rows" class:is-compact={compact}>
  {#each entries as e (e.id)}
    <li class="ledger-row" data-kind={e.kind}>
      <time class="ledger-day" datetime={e.at}>{day(e.at)}</time>
      <span class="ledger-mark" aria-hidden="true"></span>
      <div class="ledger-body">
        <p class="ledger-line">
          <span class="ledger-verb">{e.count ? `${e.count} notes on` : VERB[e.kind]}</span>
          <a class="ledger-title" href={e.href}>{e.title}</a>
        </p>
        {#if e.detail && !compact}<p class="ledger-detail">{e.detail}</p>{/if}
        <p class="ledger-meta">
          <span>{e.project}</span>
          {#if !compact}
            {#each e.links ?? [] as link}
              <span class="ledger-sep">·</span><a href={link.uri} rel="noopener">{link.title}</a>
            {/each}
          {/if}
        </p>
      </div>
    </li>
  {/each}
</ol>

<style>
  .ledger-rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .ledger-row {
    display: grid;
    grid-template-columns: 6ch 0.6rem minmax(0, 1fr);
    gap: var(--space-sm);
    align-items: baseline;
    padding: var(--space-xs) 0;
    border-bottom: var(--rule) solid var(--ink-rule-soft);
  }

  .ledger-day {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    white-space: nowrap;
  }

  /* One mark per kind of event, all from the same pencil. */
  .ledger-mark {
    width: 0.55rem;
    height: 0.55rem;
    border: var(--rule) solid var(--ink-muted);
    transform: translateY(-0.05rem);
  }

  [data-kind='finished'] .ledger-mark,
  [data-kind='published'] .ledger-mark {
    background: var(--ink-accent);
    border-color: var(--ink-accent);
  }

  [data-kind='merged'] .ledger-mark,
  [data-kind='opened'] .ledger-mark {
    border-color: var(--ink-accent);
  }

  [data-kind='noted'] .ledger-mark {
    height: 0;
    border-width: var(--rule) 0 0;
  }

  .ledger-body p {
    margin: 0;
  }

  .ledger-line {
    font-family: var(--font-display);
    font-size: var(--type-sm);
    line-height: 1.4;
  }

  .ledger-verb {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-text-soft);
    margin-right: 0.5em;
  }

  .ledger-title {
    font-weight: 600;
    color: var(--ink-text);
    text-decoration: none;
  }

  .ledger-title:hover {
    color: var(--ink-accent);
  }

  [data-kind='published'] .ledger-title {
    font-size: var(--type-h4);
  }

  .ledger-body {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .ledger-detail {
    margin-top: var(--space-3xs) !important;
    max-width: var(--measure);
    color: var(--ink-text-soft);
    font-size: 1rem;
    line-height: 1.5;
  }

  .ledger-meta {
    margin-top: var(--space-3xs) !important;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
  }

  .ledger-meta a {
    color: inherit;
    text-decoration-color: var(--ink-accent);
  }

  .ledger-sep {
    margin: 0 0.4em;
  }

  .is-compact .ledger-row {
    padding: var(--space-2xs) 0;
  }
</style>
