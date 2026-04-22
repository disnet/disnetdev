<script lang="ts">
    let { data } = $props();

    function formatShortDate(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function hostOf(url: string) {
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }
</script>

<svelte:head>
    <title>{data.collection.name} · Library · disnetdev</title>
    <meta
        name="description"
        content={data.collection.description ||
            `Cards filed under ${data.collection.name}.`}
    />
</svelte:head>

<nav class="crumbs" aria-label="Breadcrumb">
    <a class="crumbs-link" href="/library">
        <span class="crumbs-glyph" aria-hidden="true">◂</span>
        library
    </a>
    <span class="crumbs-sep" aria-hidden="true">/</span>
    <span class="crumbs-current">shelves</span>
</nav>

<section class="heading-block">
    <p class="page-eyebrow">collection</p>
    <h1 class="page-heading">{data.collection.name}</h1>
    {#if data.collection.description}
        <p class="page-lede">{data.collection.description}</p>
    {/if}
    <dl class="meta-bar">
        <div class="meta-item">
            <dt>Cards</dt>
            <dd>{data.cards.length}</dd>
        </div>
        <div class="meta-item">
            <dt>Access</dt>
            <dd>{data.collection.accessType.toLowerCase()}</dd>
        </div>
        {#if data.collection.updatedAt}
            <div class="meta-item">
                <dt>Updated</dt>
                <dd>{formatShortDate(data.collection.updatedAt)}</dd>
            </div>
        {/if}
    </dl>
</section>

{#if data.cards.length === 0}
    <p class="empty">
        <span class="empty-prompt">▸</span> this shelf is empty.
    </p>
{:else}
    <ol class="cards">
        {#each data.cards as card, i}
            <li class="card">
                <span class="card-num">
                    {String(i + 1).padStart(2, "0")}
                </span>
                <div class="card-body">
                    <h2 class="card-title">
                        <a href={card.url} rel="noopener">
                            {card.title || card.url}
                        </a>
                    </h2>
                    {#if card.description}
                        <p class="card-desc">{card.description}</p>
                    {/if}
                    <p class="card-meta">
                        <span class="card-meta-host"
                            >{card.siteName || hostOf(card.url)}</span
                        >
                        {#if card.author}
                            <span class="card-meta-sep">·</span>
                            <span class="card-meta-author">{card.author}</span>
                        {/if}
                        <span class="card-meta-sep">·</span>
                        <span class="card-meta-date"
                            >{formatShortDate(card.createdAt)}</span
                        >
                    </p>
                </div>
            </li>
        {/each}
    </ol>
{/if}

<style>
    .crumbs {
        font-family: var(--font-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.08em;
        text-transform: lowercase;
        color: var(--ink-muted);
        margin-bottom: var(--space-md);
        display: inline-flex;
        align-items: baseline;
        gap: 0.6ch;
    }

    .crumbs-link {
        color: var(--ink-text-soft);
        text-decoration: none;
        transition: color 120ms ease-out;
        display: inline-flex;
        align-items: baseline;
        gap: 0.4ch;
    }

    .crumbs-link:hover,
    .crumbs-link:focus-visible {
        color: var(--ink-accent-hover);
    }

    .crumbs-glyph {
        color: var(--ink-accent);
    }

    .crumbs-sep {
        color: var(--ink-rule);
    }

    .crumbs-current {
        color: var(--ink-text-soft);
    }

    .heading-block {
        margin-bottom: var(--space-2xl);
    }

    .meta-bar {
        margin: var(--space-md) 0 0;
        padding-top: var(--space-sm);
        border-top: var(--rule) solid var(--ink-rule-soft);
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-lg);
        max-width: var(--measure);
    }

    .meta-item {
        display: grid;
        gap: var(--space-3xs);
    }

    .meta-item dt {
        font-family: var(--font-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.14em;
        text-transform: lowercase;
        color: var(--ink-muted);
        margin: 0;
    }

    .meta-item dd {
        font-family: var(--font-mono);
        font-size: var(--type-sm);
        color: var(--ink-text);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.02em;
        margin: 0;
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

    .cards {
        list-style: none;
        padding: 0;
        margin: 0;
        max-width: var(--measure-wide);
    }

    .card {
        display: grid;
        grid-template-columns: 4ch 1fr;
        column-gap: var(--space-md);
        padding: var(--space-md) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .card:last-child {
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    .card-num {
        font-family: var(--font-mono);
        font-size: var(--type-sm);
        color: var(--ink-accent);
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
        padding-top: 0.45em;
        line-height: 1;
    }

    .card-body {
        display: grid;
        gap: var(--space-3xs);
        max-width: var(--measure);
        min-width: 0;
    }

    .card-title {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: var(--type-lg);
        line-height: 1.3;
        letter-spacing: -0.005em;
        margin: 0;
    }

    .card-title a {
        color: var(--ink-text);
        text-decoration: none;
        overflow-wrap: anywhere;
    }

    .card-title a:hover,
    .card-title a:focus-visible {
        color: var(--ink-accent-hover);
    }

    .card-desc {
        color: var(--ink-text-soft);
        font-size: 1rem;
        line-height: 1.55;
        margin: 0;
    }

    .card-meta {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
        margin: var(--space-3xs) 0 0;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5ch;
        font-variant-numeric: tabular-nums;
    }

    .card-meta-sep {
        color: var(--ink-rule);
    }

    .card-meta-author {
        color: var(--ink-text-soft);
    }
</style>
