<script lang="ts">
  let { data } = $props();
</script>

<p class="eyebrow">A request at the door</p>
<h1 class="consent-title">{data.clientName} would like to work at your desk.</h1>

<p class="consent-origin">Access goes to <strong>{data.redirectHost}</strong></p>

<div class="consent-body">
  <p>If you allow it, it can:</p>
  <ul>
    <li>read your drafts,</li>
    <li>write new drafts and revise unpublished ones,</li>
    <li>upload images for them.</li>
  </ul>
  <p>It cannot publish, and it cannot touch posts that are already published. Publishing stays here, with you.</p>
  <p>Only allow this if you just asked Claude to connect. If a link brought you here unprompted, choose not now.</p>
</div>

<form method="POST" class="editor-foot">
  <div class="editor-foot-primary">
    <button type="submit" name="decision" value="allow" class="action action--primary">
      <span>Allow</span>
      <span aria-hidden="true">↗</span>
    </button>
    <button type="submit" name="decision" value="deny" class="action">Not now</button>
  </div>
</form>

<style>
  .consent-title {
    font-family: var(--ff-display);
    font-weight: 500;
    font-size: var(--fz-2xl);
    line-height: 1.15;
    color: var(--ink);
    margin: var(--s-2) 0 var(--s-5);
  }

  .consent-origin {
    font-family: var(--ff-mono);
    font-size: var(--fz-sm);
    color: var(--ink-2);
    margin: 0 0 var(--s-5);
  }

  .consent-origin strong {
    color: var(--accent);
    font-weight: 400;
  }

  .consent-body {
    max-width: 60ch;
    font-family: var(--ff-body);
    font-size: var(--fz-base);
    line-height: 1.6;
    color: var(--ink-2);
  }

  .consent-body ul {
    margin: 0.5em 0 1em;
    padding-left: 1.25em;
  }
</style>
