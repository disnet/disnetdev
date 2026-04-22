<script lang="ts">
    let { data } = $props();

    function formatDate(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function hostOf(url: string) {
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }

    const hasPrev = $derived(data.page > 1);
    const hasNext = $derived(data.page < data.totalPages);
    const prevHref = $derived(data.page - 1 <= 1 ? "/reading" : `/reading?page=${data.page - 1}`);
    const nextHref = $derived(`/reading?page=${data.page + 1}`);
</script>

<svelte:head>
    <title>Reading · disnetdev</title>
    <meta
        name="description"
        content="Articles, posts, and pieces I've shared recently, with notes."
    />
</svelte:head>

<section class="heading-block">
    <p class="page-eyebrow">dispatch</p>
    <h1 class="page-heading">Reading</h1>
    <p class="page-lede">
        Things I've read and wanted to keep, shared via
        <a href="https://skyreader.app">Skyreader</a>. Sometimes with a note,
        sometimes just the pointer. {data.total} share{data.total === 1 ? "" : "s"}
        so far.
    </p>
</section>

{#if data.shares.length === 0}
    <p class="empty">
        <span class="empty-prompt">▸</span> nothing shared yet.
    </p>
{:else}
    <ol class="shares">
        {#each data.shares as share}
            <li class="share">
                <span class="share-date">{formatDate(share.createdAt)}</span>
                <div class="share-body">
                    {#if share.note}
                        <p class="share-note">{share.note}</p>
                        <p class="share-cite">
                            <span class="share-cite-glyph" aria-hidden="true">▸</span>
                            <a class="share-cite-link" href={share.itemUrl} rel="noopener">
                                {share.itemTitle || share.itemUrl}
                            </a>
                            {#if share.itemAuthor}
                                <span class="share-cite-sep">·</span>
                                <span class="share-cite-author">{share.itemAuthor}</span>
                            {/if}
                            <span class="share-cite-sep">·</span>
                            <span class="share-cite-host">{hostOf(share.itemUrl)}</span>
                        </p>
                    {:else}
                        <h2 class="share-title">
                            <a href={share.itemUrl} rel="noopener">
                                {share.itemTitle || share.itemUrl}
                            </a>
                        </h2>
                        {#if share.itemDescription}
                            <p class="share-desc">{share.itemDescription}</p>
                        {/if}
                        <p class="share-meta">
                            {#if share.itemAuthor}
                                <span>{share.itemAuthor}</span>
                                <span class="share-cite-sep">·</span>
                            {/if}
                            <span class="share-cite-host">{hostOf(share.itemUrl)}</span>
                        </p>
                    {/if}
                    {#if share.tags?.length}
                        <p class="share-tags">
                            {#each share.tags as tag, i}
                                <span>{tag}</span>{#if i < share.tags.length - 1}<span class="share-cite-sep"> · </span>{/if}
                            {/each}
                        </p>
                    {/if}
                </div>
            </li>
        {/each}
    </ol>

    {#if data.totalPages > 1}
        <nav class="pager" aria-label="Pagination">
            {#if hasPrev}
                <a class="pager-link pager-link--prev" href={prevHref} rel="prev">
                    ◂ newer
                </a>
            {:else}
                <span class="pager-gap"></span>
            {/if}

            <span class="pager-pos">
                page {data.page} of {data.totalPages}
            </span>

            {#if hasNext}
                <a class="pager-link pager-link--next" href={nextHref} rel="next">
                    older ▸
                </a>
            {:else}
                <span class="pager-gap"></span>
            {/if}
        </nav>
    {/if}
{/if}

<style>
    .heading-block {
        margin-bottom: var(--space-2xl);
    }

    .empty {
        font-style: italic;
        color: var(--ink-text-soft);
        max-width: var(--measure);
        line-height: 1.6;
    }

    .empty-prompt {
        color: var(--ink-accent);
        font-style: normal;
        margin-right: 0.3ch;
    }

    .shares {
        list-style: none;
        padding: 0;
        margin: 0;
        max-width: var(--measure-wide);
    }

    .share {
        display: grid;
        grid-template-columns: 10ch 1fr;
        column-gap: var(--space-md);
        padding: var(--space-lg) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .share:last-child {
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    .share-date {
        font-family: var(--font-mono);
        font-size: var(--type-sm);
        color: var(--ink-muted);
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
        padding-top: 0.4em;
        white-space: nowrap;
    }

    .share-body {
        display: grid;
        gap: var(--space-2xs);
        max-width: var(--measure);
    }

    .share-note {
        font-family: var(--font-body);
        font-size: var(--type-lg);
        line-height: 1.55;
        color: var(--ink-text);
        margin: 0;
    }

    .share-cite {
        font-family: var(--font-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.04em;
        color: var(--ink-text-soft);
        margin: 0;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5ch;
        line-height: 1.5;
    }

    .share-cite-glyph {
        color: var(--ink-accent);
    }

    .share-cite-link {
        color: var(--ink-text);
        text-decoration: none;
        padding-bottom: 1px;
        border-bottom: 1px dotted var(--ink-rule);
        font-family: var(--font-body);
        font-size: 1rem;
        letter-spacing: 0;
        font-style: italic;
        transition:
            color 120ms ease-out,
            border-color 120ms ease-out;
    }

    .share-cite-link:hover,
    .share-cite-link:focus-visible {
        color: var(--ink-accent-hover);
        border-bottom-color: currentColor;
    }

    .share-cite-sep {
        color: var(--ink-rule);
    }

    .share-cite-author {
        color: var(--ink-text-soft);
        font-family: var(--font-body);
        font-size: 1rem;
        letter-spacing: 0;
    }

    .share-cite-host {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
    }

    .share-title {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: var(--type-xl);
        line-height: 1.25;
        letter-spacing: -0.005em;
        margin: 0;
    }

    .share-title a {
        color: var(--ink-text);
        text-decoration: none;
    }

    .share-title a:hover,
    .share-title a:focus-visible {
        color: var(--ink-accent-hover);
    }

    .share-desc {
        color: var(--ink-text-soft);
        font-size: 1rem;
        line-height: 1.55;
        margin: 0;
    }

    .share-meta {
        font-family: var(--font-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.04em;
        color: var(--ink-muted);
        margin: 0;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5ch;
    }

    .share-tags {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
        margin: var(--space-2xs) 0 0;
    }

    .pager {
        margin-top: var(--space-2xl);
        padding-top: var(--space-md);
        border-top: var(--rule) solid var(--ink-rule);
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: baseline;
        gap: var(--space-md);
        font-family: var(--font-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.08em;
        text-transform: lowercase;
    }

    .pager-link {
        color: var(--ink-text-soft);
        text-decoration: none;
        transition: color 120ms ease-out;
    }

    .pager-link:hover,
    .pager-link:focus-visible {
        color: var(--ink-accent-hover);
    }

    .pager-link--prev {
        justify-self: start;
    }

    .pager-link--next {
        justify-self: end;
    }

    .pager-pos {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.04em;
        text-align: center;
    }

    .pager-gap {
        display: block;
    }
</style>
