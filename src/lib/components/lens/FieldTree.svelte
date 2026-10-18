<script lang="ts">
  import FieldTree from './FieldTree.svelte';
  import { lensHrefForUri } from '$lib/lens/paths';

  // A record laid out as a specimen sheet: every field, typed, with references
  // turned into lens links so you can walk the graph from here.
  let {
    value,
    blobBase,
    depth = 0
  }: { value: unknown; blobBase: string; depth?: number } = $props();

  const ARRAY_LIMIT = 40;
  const LONG_TEXT = 1200;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

  type Blob = { $type: 'blob'; ref: { $link: string }; mimeType: string; size: number };

  function isBlob(v: unknown): v is Blob {
    return (
      typeof v === 'object' && v !== null && (v as Blob).$type === 'blob' &&
      typeof (v as Blob).ref?.$link === 'string'
    );
  }

  function isCidLink(v: unknown): v is { $link: string } {
    return (
      typeof v === 'object' && v !== null && Object.keys(v).length === 1 &&
      typeof (v as { $link?: unknown }).$link === 'string'
    );
  }

  function shortCid(cid: string) {
    return cid.length > 16 ? `${cid.slice(0, 8)}…${cid.slice(-6)}` : cid;
  }

  function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  function formatDate(s: string) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: s.includes('T') ? 'numeric' : undefined,
      minute: s.includes('T') ? '2-digit' : undefined
    });
  }

  const entries = $derived(
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>).filter(([k]) => k !== '$type')
      : []
  );
  const typeTag = $derived(
    value && typeof value === 'object' && !Array.isArray(value)
      ? ((value as { $type?: unknown }).$type as string | undefined)
      : undefined
  );
</script>

{#if value === null || value === undefined}
  <span class="ft-atom ft-null">null</span>
{:else if typeof value === 'boolean' || typeof value === 'number'}
  <span class="ft-atom">{String(value)}</span>
{:else if typeof value === 'string'}
  {@const href = lensHrefForUri(value)}
  {#if href}
    <a class="ft-ref" {href}><span aria-hidden="true">▸</span> {value}</a>
  {:else if /^https?:\/\//.test(value) && !/\s/.test(value)}
    <a class="ft-url" href={value} rel="noopener nofollow">{value}</a>
  {:else if ISO_DATE.test(value)}
    <time class="ft-atom" datetime={value} title={value}>{formatDate(value)}</time>
  {:else if value.length > LONG_TEXT}
    <details class="ft-long">
      <summary>{value.slice(0, 280)}… <span class="ft-more">{value.length.toLocaleString()} chars</span></summary>
      <p class="ft-text">{value}</p>
    </details>
  {:else if value.length > 80 || value.includes('\n')}
    <p class="ft-text">{value}</p>
  {:else}
    <span class="ft-string">{value}</span>
  {/if}
{:else if isBlob(value)}
  <span class="ft-blob">
    {#if value.mimeType.startsWith('image/')}
      <a href={`${blobBase}${value.ref.$link}`} rel="noopener">
        <img src={`${blobBase}${value.ref.$link}`} alt="" loading="lazy" decoding="async" />
      </a>
    {/if}
    <span class="ft-atom">blob · {value.mimeType} · {formatBytes(value.size)}</span>
    <a class="ft-cid" href={`${blobBase}${value.ref.$link}`} rel="noopener" title={value.ref.$link}>
      {shortCid(value.ref.$link)}
    </a>
  </span>
{:else if isCidLink(value)}
  <span class="ft-cid" title={value.$link}>{shortCid(value.$link)}</span>
{:else if Array.isArray(value)}
  {#if value.length === 0}
    <span class="ft-atom ft-null">[ ]</span>
  {:else}
    <ol class="ft-list">
      {#each value.slice(0, ARRAY_LIMIT) as item, i}
        <li>
          <span class="ft-index">{i}</span>
          <div class="ft-cell"><FieldTree value={item} {blobBase} depth={depth + 1} /></div>
        </li>
      {/each}
      {#if value.length > ARRAY_LIMIT}
        <li class="ft-more">+{value.length - ARRAY_LIMIT} more</li>
      {/if}
    </ol>
  {/if}
{:else}
  <div class="ft-object" class:ft-nested={depth > 0}>
    {#if typeTag}
      <p class="ft-type">{typeTag}</p>
    {/if}
    <dl>
      {#each entries as [key, child]}
        <div class="ft-field">
          <dt>{key}</dt>
          <dd><FieldTree value={child} {blobBase} depth={depth + 1} /></dd>
        </div>
      {/each}
    </dl>
  </div>
{/if}
