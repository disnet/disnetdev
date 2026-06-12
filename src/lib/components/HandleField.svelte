<script lang="ts">
  import { untrack } from 'svelte';

  let {
    id,
    name = 'handle',
    placeholder = 'you.bsky.social',
    initial = ''
  }: {
    id: string;
    name?: string;
    placeholder?: string;
    initial?: string;
  } = $props();

  type Actor = { handle: string; displayName?: string };

  let query = $state(untrack(() => initial));
  let suggestions = $state<Actor[]>([]);
  let open = $state(false);
  let activeIndex = $state(-1);

  let debounce: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const listboxId = $derived(`${id}-listbox`);
  const activeId = $derived(activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined);

  // Public Bluesky AppView — handle typeahead, no auth required.
  const TYPEAHEAD_URL = 'https://public.api.bsky.app/xrpc/app.bsky.actor.searchActorsTypeahead';

  async function search(q: string) {
    controller?.abort();
    controller = new AbortController();
    try {
      const res = await fetch(`${TYPEAHEAD_URL}?q=${encodeURIComponent(q)}&limit=6`, {
        signal: controller.signal
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        actors?: Array<{ handle: string; displayName?: string }>;
      };
      suggestions = (data.actors ?? []).map((a) => ({
        handle: a.handle,
        displayName: a.displayName
      }));
      activeIndex = -1;
      open = suggestions.length > 0;
    } catch {
      // Aborted or offline — the field still works as a plain text input.
    }
  }

  function onInput() {
    clearTimeout(debounce);
    const q = query.trim().replace(/^@+/, '');
    if (q.length < 1) {
      suggestions = [];
      open = false;
      return;
    }
    debounce = setTimeout(() => search(q), 180);
  }

  function choose(actor: Actor) {
    query = actor.handle;
    suggestions = [];
    open = false;
    activeIndex = -1;
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      open = false;
      activeIndex = -1;
    }
  }
</script>

<div class="handle-field">
  <input
    {id}
    {name}
    {placeholder}
    type="text"
    inputmode="url"
    autocomplete="off"
    autocapitalize="none"
    spellcheck="false"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={open}
    aria-controls={listboxId}
    aria-activedescendant={activeId}
    bind:value={query}
    oninput={onInput}
    onkeydown={onKeydown}
    onblur={() => (open = false)} />

  {#if open}
    <ul class="handle-suggestions" id={listboxId} role="listbox">
      {#each suggestions as actor, i (actor.handle)}
        <li
          class="handle-option"
          id={`${id}-opt-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          onmousedown={(event) => {
            event.preventDefault();
            choose(actor);
          }}>
          <span class="handle-option-handle">{actor.handle}</span>
          {#if actor.displayName}
            <span class="handle-option-name">{actor.displayName}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .handle-field {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .handle-field > input {
    width: 100%;
    padding: 0.5rem 0.7rem;
    font-family: var(--font-mono);
    font-size: var(--type-sm);
    color: var(--ink-text);
    background: var(--ink-page);
    border: var(--rule) solid var(--ink-rule);
    border-radius: 0.4rem;
    transition: border-color 150ms ease-out;
  }

  .handle-field > input:focus-visible {
    outline: none;
    border-color: var(--ink-accent);
  }

  .handle-suggestions {
    position: absolute;
    top: calc(100% + 0.3rem);
    left: 0;
    right: 0;
    z-index: 30;
    margin: 0;
    padding: 0.25rem;
    list-style: none;
    background: var(--ink-page);
    border: var(--rule) solid var(--ink-rule);
    border-radius: 0.4rem;
    max-height: 15rem;
    overflow-y: auto;
    box-shadow: 0 0.5rem 1.5rem -0.75rem oklch(0.2 0.02 60 / 0.35);
  }

  .handle-option {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    padding: 0.35rem 0.5rem;
    border-radius: 0.3rem;
    cursor: pointer;
  }

  .handle-option[aria-selected='true'],
  .handle-option:hover {
    background: var(--ink-surface);
  }

  .handle-option-handle {
    font-family: var(--font-mono);
    font-size: var(--type-sm);
    color: var(--ink-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .handle-option-name {
    font-family: var(--font-meta);
    font-size: var(--type-xs);
    letter-spacing: 0.02em;
    color: var(--ink-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
