<script lang="ts">
    let { data } = $props();

    function formatShortDate(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
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
    const prevHref = $derived(
        data.page - 1 <= 1 ? "/library" : `/library?page=${data.page - 1}`,
    );
    const nextHref = $derived(`/library?page=${data.page + 1}`);
</script>

<svelte:head>
    <title>Library · disnetdev</title>
    <meta
        name="description"
        content="Cards and collections from my Semble library — things saved for later, sorted into shelves."
    />
</svelte:head>

<section class="heading-block">
    <p class="page-eyebrow">catalog</p>
    <h1 class="page-heading">Library</h1>
    <p class="page-lede">
        Cards and collections from my
        <a href="https://semble.so/profile/disnetdev.com">Semble</a>
        library. Pages saved for later, grouped into shelves I return to.
        {data.totalCards} card{data.totalCards === 1 ? "" : "s"}, {data.totalCollections}
        shelf{data.totalCollections === 1 ? "" : "ves"}.
    </p>
</section>

{#if data.collections.length > 0}
    <section aria-labelledby="shelves-heading" class="catalog">
        <header class="catalog-header">
            <h2 id="shelves-heading" class="catalog-title">Shelves</h2>
            <span class="catalog-sublabel"
                >{data.totalCollections} collection{data.totalCollections === 1
                    ? ""
                    : "s"}</span
            >
        </header>

        <ul class="shelves">
            {#each data.collections as collection}
                <li class="shelf">
                    <a class="shelf-link" href={`/library/${collection.rkey}`}>
                        <div class="shelf-head">
                            <span class="shelf-label">Collection</span>
                            <span class="shelf-count">
                                {collection.cardCount}
                                <span class="shelf-count-unit"
                                    >{collection.cardCount === 1 ? "card" : "cards"}</span
                                >
                            </span>
                        </div>
                        <h3 class="shelf-name">{collection.name}</h3>
                        {#if collection.description}
                            <p class="shelf-desc">{collection.description}</p>
                        {/if}
                    </a>
                </li>
            {/each}
        </ul>
    </section>
{/if}

<section aria-labelledby="recent-heading" class="catalog">
    <header class="catalog-header">
        <h2 id="recent-heading" class="catalog-title">Recently filed</h2>
        <span class="catalog-sublabel">
            {#if data.totalPages > 1}
                page {data.page} / {data.totalPages}
            {:else}
                {data.totalCards} card{data.totalCards === 1 ? "" : "s"}
            {/if}
        </span>
    </header>

    {#if data.cards.length === 0}
        <p class="empty">
            <span class="empty-prompt">▸</span> nothing in the stacks yet.
        </p>
    {:else}
        <ol class="cards">
            {#each data.cards as card}
                <li class="card">
                    <span class="card-mark" aria-hidden="true">◆</span>
                    <div class="card-body">
                        <h3 class="card-title">
                            <a href={card.url} rel="noopener">
                                {card.title || card.url}
                            </a>
                        </h3>
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

        {#if data.totalPages > 1}
            <nav class="pager" aria-label="Pagination">
                {#if hasPrev}
                    <a class="pager-link pager-link--prev" href={prevHref} rel="prev"
                        >◂ newer</a
                    >
                {:else}
                    <span class="pager-gap"></span>
                {/if}

                <span class="pager-pos">
                    page {data.page} of {data.totalPages}
                </span>

                {#if hasNext}
                    <a class="pager-link pager-link--next" href={nextHref} rel="next"
                        >older ▸</a
                    >
                {:else}
                    <span class="pager-gap"></span>
                {/if}
            </nav>
        {/if}
    {/if}
</section>

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

    /* ——— catalog sections ——— */
    .catalog {
        margin-bottom: var(--space-2xl);
        max-width: var(--measure-wide);
    }

    .catalog-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
        padding-bottom: var(--space-2xs);
        border-bottom: var(--rule) solid var(--ink-rule);
    }

    .catalog-title {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: var(--type-h2);
        letter-spacing: -0.01em;
        margin: 0;
        color: var(--ink-text);
    }

    .catalog-sublabel {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        letter-spacing: 0.06em;
        color: var(--ink-muted);
        font-variant-numeric: tabular-nums;
    }

    /* ——— shelves (collections grid) ——— */
    .shelves {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
        gap: 0;
    }

    .shelf {
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    /* Add a vertical rule between shelves in the same row */
    @media (min-width: 44rem) {
        .shelves {
            grid-template-columns: repeat(2, 1fr);
        }
        .shelf:nth-child(odd) {
            border-right: var(--rule) solid var(--ink-rule-soft);
        }
    }

    .shelf-link {
        display: block;
        padding: var(--space-md) var(--space-md) var(--space-md) 0;
        text-decoration: none;
        color: inherit;
        transition: background 150ms ease-out;
    }

    @media (min-width: 44rem) {
        .shelf:nth-child(even) .shelf-link {
            padding-left: var(--space-md);
            padding-right: 0;
        }
    }

    .shelf-link:hover,
    .shelf-link:focus-visible {
        background: var(--ink-surface);
    }

    .shelf-link:focus-visible {
        outline-offset: -2px;
    }

    .shelf-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: var(--space-md);
        margin-bottom: var(--space-2xs);
    }

    .shelf-label {
        font-family: var(--font-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.18em;
        text-transform: lowercase;
        color: var(--ink-muted);
    }

    .shelf-count {
        font-family: var(--font-mono);
        font-size: var(--type-sm);
        font-variant-numeric: tabular-nums;
        color: var(--ink-accent);
        letter-spacing: 0.02em;
    }

    .shelf-count-unit {
        color: var(--ink-muted);
        font-size: var(--type-xs);
        letter-spacing: 0.08em;
        margin-left: 0.4ch;
    }

    .shelf-name {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: var(--type-lg);
        line-height: 1.2;
        letter-spacing: -0.005em;
        margin: 0 0 var(--space-3xs);
        color: var(--ink-text);
        transition: color 120ms ease-out;
    }

    .shelf-link:hover .shelf-name,
    .shelf-link:focus-visible .shelf-name {
        color: var(--ink-accent-hover);
    }

    .shelf-desc {
        color: var(--ink-text-soft);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
        max-width: var(--measure);
    }

    /* ——— cards (recently filed feed) ——— */
    .cards {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .card {
        display: grid;
        grid-template-columns: 1.5ch 1fr;
        column-gap: var(--space-sm);
        padding: var(--space-md) 0;
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    .card-mark {
        color: var(--ink-accent);
        font-size: 0.7em;
        padding-top: 0.85em;
        line-height: 1;
        user-select: none;
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
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
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

    .card-meta-host {
        color: var(--ink-muted);
    }

    .card-meta-author {
        color: var(--ink-text-soft);
    }

    .card-meta-date {
        color: var(--ink-muted);
    }

    /* ——— pager (shared pattern with /reading) ——— */
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
