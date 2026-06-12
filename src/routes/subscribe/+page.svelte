<script lang="ts">
  import HandleField from '$lib/components/HandleField.svelte';

  let { data, form } = $props();

  const handleValue = $derived(form?.handle ?? '');
</script>

<svelte:head>
  <title>Subscribe — disnetdev</title>
  <meta name="description" content="Follow disnetdev over ATProto or RSS." />
</svelte:head>

<article class="subscribe-page prose">
  <h1>Subscribe</h1>

  {#if data.subscribed}
    <p class="subscribe-confirm">
      <span class="subscribe-confirm-glyph" aria-hidden="true">▸</span>
      You're subscribed. New posts will surface in any standard.site reader you use.
    </p>
    <p>You can remove the subscription record from your repo whenever you like.</p>
    <form class="subscribe-form" method="POST" action="?/unsubscribe">
      <input type="hidden" name="redirectTo" value="/subscribe" />
      <button type="submit" class="subscribe-unsub-button">Unsubscribe</button>
    </form>
  {:else}
    <p class="subscribe-lede">
      New writing on programming-language design, local-first software, and ATProto.
      Two ways to follow along, no email required.
    </p>

    <section class="subscribe-option">
      <h2>Subscribe with your Atmosphere account</h2>
      <p>
        Sign in with your handle and a
        <code>site.standard.graph.subscription</code> record is written to your own
        PDS, pointing at this publication. Any standard.site reader will then show new
        posts.
      </p>

      <form class="subscribe-form" method="POST" action="?/subscribe">
        <input type="hidden" name="redirectTo" value="/subscribe" />
        <label class="subscribe-label" for="handle">Your handle</label>
        <div class="subscribe-row">
          <HandleField id="handle" placeholder="you.bsky.social" initial={handleValue} />
          <button type="submit">Subscribe</button>
        </div>
        {#if form?.error || data.error}
          <p class="subscribe-error">
            {form?.error ??
              (data.error === 'write'
                ? 'Signed in, but the subscription record could not be written. Please try again.'
                : 'Something went wrong. Please try again.')}
          </p>
        {/if}
      </form>
    </section>

    <section class="subscribe-option">
      <h2>Over RSS</h2>
      <p>
        Prefer a feed reader? Point it at
        <a href="/feed.xml">disnetdev.com/feed.xml</a>.
      </p>
    </section>
  {/if}
</article>

<style>
  .subscribe-page {
    max-width: var(--measure);
    margin: 0 auto;
  }

  .subscribe-lede {
    color: var(--ink-text-soft);
  }

  .subscribe-option {
    margin-top: var(--space-xl);
    padding-top: var(--space-lg);
    border-top: var(--rule) solid var(--ink-rule);
  }

  .subscribe-option h2 {
    font-family: var(--font-meta);
    font-size: var(--type-sm);
    letter-spacing: 0.08em;
    text-transform: lowercase;
    color: var(--ink-muted);
    margin-bottom: var(--space-2xs);
  }

  .subscribe-form {
    margin-top: var(--space-md);
  }

  .subscribe-label {
    display: block;
    font-family: var(--font-meta);
    font-size: var(--type-sm);
    letter-spacing: 0.06em;
    text-transform: lowercase;
    color: var(--ink-muted);
    margin-bottom: var(--space-2xs);
  }

  .subscribe-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: stretch;
  }

  .subscribe-row button {
    padding: 0.55rem 1rem;
    font-family: var(--font-meta);
    font-size: var(--type-sm);
    letter-spacing: 0.06em;
    text-transform: lowercase;
    color: var(--ink-page);
    background: var(--ink-accent);
    border: var(--rule) solid var(--ink-accent);
    border-radius: 0.4rem;
    cursor: pointer;
    transition:
      background-color 150ms ease-out,
      border-color 150ms ease-out;
  }

  .subscribe-row button:hover,
  .subscribe-row button:focus-visible {
    background: var(--ink-accent-hover);
    border-color: var(--ink-accent-hover);
  }

  .subscribe-error {
    margin-top: var(--space-2xs);
    font-family: var(--font-meta);
    font-size: var(--type-sm);
    color: var(--ink-accent-hover);
  }

  .subscribe-confirm {
    font-size: var(--type-lg);
  }

  .subscribe-confirm-glyph {
    color: var(--ink-accent);
    margin-right: 0.35ch;
  }
</style>
