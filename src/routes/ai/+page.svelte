<script lang="ts">
  import { AI_GENERATED_TAG } from '$lib/ai-disclosure';
</script>

<svelte:head>
  <title>How I use AI here · disnetdev</title>
  <meta name="description" content="How posts on disnetdev are written, and what the vibeslop label means." />
</svelte:head>

<article class="ai-policy-page prose">
  <h1>How I use AI here</h1>

  <p>Every post on this site is one of two kinds.</p>

  <h2>Hand-written</h2>
  <p>
    I wrote the words and did the thinking. I sometimes use AI as an editor, to
    point out where an argument is thin or a sentence doesn't work, but the prose is mine.
    These posts have no label.
  </p>

  <h2>Vibeslop</h2>
  <p>
    Posts tagged <strong>{AI_GENERATED_TAG}</strong>, with a label under the title, were
    generated mostly by AI. They come from my own notes and journal, and I steer and edit
    them, but most of the sentences are the model's. They're an experiment in how far
    human/AI collaboration should go.
  </p>

  <h2>Where this comes from</h2>
  <p>
    Venkatesh Rao's motto
    <a href="https://contraptions.venkateshrao.com/p/be-slightly-monstrous">“be slightly monstrous”</a>,
    and his account of writing that way in
    <a href="https://contraptions.venkateshrao.com/p/experiments-with-monstrousness">Experiments with Monstrousness</a>.
  </p>
</article>

<style>
  .ai-policy-page {
    max-width: var(--measure);
    margin: 0 auto;
  }
</style>
