<script lang="ts">
  let { data, form } = $props();
</script>

<svelte:head>
  <title>Sign in</title>
</svelte:head>

<h1>Sign in with Bluesky</h1>
<p>Only the configured author DID can access admin features.</p>

{#if data.error === 'unauthorized'}
  <p class="error">That account authenticated successfully, but it is not the configured author account.</p>
{/if}

<form method="POST" class="stack">
  <label>
    <span>Handle</span>
    <input name="handle" type="text" placeholder="you.bsky.social" value={form?.handle ?? ''} />
  </label>

  <input type="hidden" name="redirectTo" value={form?.redirectTo ?? data.redirectTo} />

  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}

  <button type="submit">Continue</button>
</form>

<style>
  .stack {
    display: grid;
    gap: 1rem;
    max-width: 28rem;
  }

  label {
    display: grid;
    gap: 0.5rem;
  }

  input {
    padding: 0.75rem 0.9rem;
    border-radius: 0.75rem;
    border: 1px solid #31406f;
    background: #111933;
    color: inherit;
  }

  button {
    width: fit-content;
    padding: 0.8rem 1rem;
    border-radius: 999px;
    border: 0;
    background: #8aa3ff;
    color: #081126;
    font-weight: 700;
  }

  .error {
    color: #ffb4b4;
  }
</style>
