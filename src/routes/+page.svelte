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

    const socials = [
        {
            label: "bluesky",
            handle: "@disnetdev.com",
            href: "https://bsky.app/profile/disnetdev.com",
        },
        {
            label: "mastodon",
            handle: "@disnet@mastodon.social",
            href: "https://mastodon.social/@disnet",
        },
        { label: "github", handle: "@disnet", href: "https://github.com/disnet" },
        { label: "email", handle: "tim@disnetdev.com", href: "mailto:tim@disnetdev.com" },
    ];

    const projects = [
        {
            name: "Flint",
            href: "https://www.flintnote.com",
            blurb: "A note-taking app.",
        },
        {
            name: "Sweet.js",
            href: "https://sweetjs.org",
            blurb: "Hygienic macros for JavaScript.",
        },
        {
            name: "Contracts.coffee",
            href: "http://disnet.github.io/contracts.coffee/",
            blurb: "Higher-order contracts for CoffeeScript.",
        },
    ];

    const featuredPapers = [
        {
            slug: "thesis",
            title: "Hygienic Macros for JavaScript",
            venue: "Thesis",
            year: 2015,
            blurb: "My doctoral dissertation showing how to adapt a hygienic macro system to JavaScript.",
        },
        {
            slug: "virtual-values-for-language-extension",
            title: "Virtual Values for Language Extension",
            venue: "OOPSLA",
            year: 2011,
            blurb: "A generalization and formalization of existing meta-object systems, with an application to JavaScript.",
        },
        {
            slug: "temporal-higher-order-contracts",
            title: "Temporal Higher-Order Contracts",
            venue: "ICFP",
            year: 2011,
            blurb: "Bringing temporal assertions to higher-order contracts.",
        },
    ];

    const recentPosts = $derived(data.posts.slice(0, 3));
    const hasMorePosts = $derived(data.posts.length > 3);
    const recentShares = $derived(data.shares);
    const hasMoreShares = $derived(data.sharesTotal > data.shares.length);

    function hostOf(url: string) {
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }
</script>

<svelte:head>
    <title>{data.publication.record.name}</title>
    <meta name="description" content={data.publication.record.description ?? ""} />
</svelte:head>

<section class="intro">
    <p class="page-eyebrow">dispatch</p>
    <h1 class="page-heading">Tim Disney</h1>
    <p class="page-lede">
        I make code and things. Programming languages, the web, and the <a
            href="https://atproto.com/">Atmosphere</a
        > bring me joy.
    </p>

    <ul class="signals" aria-label="Reach me">
        {#each socials as s}
            <li class="signal">
                <span class="signal-label">{s.label}</span>
                <a
                    class="signal-link"
                    href={s.href}
                    rel={s.label === "bluesky" || s.label === "mastodon"
                        ? "me"
                        : undefined}
                >
                    {s.handle}
                </a>
            </li>
        {/each}
    </ul>
</section>

<section aria-labelledby="recent-heading" class="band">
    <header class="band-header">
        <h2 id="recent-heading" class="band-title">Recent posts</h2>
        {#if hasMorePosts}
            <a href="/blog" class="read-more">all posts</a>
        {/if}
    </header>

    {#if recentPosts.length === 0}
        <p class="empty">
            <span class="empty-prompt">▸</span> the transmitter is warm but quiet. the first
            post from the new stack is on its way.
        </p>
    {:else}
        <ol class="index">
            {#each recentPosts as post}
                <li class="index-entry">
                    <span class="index-num">
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                    <div class="index-body">
                        <h3 class="index-title">
                            <a href={post.path}>{post.title}</a>
                        </h3>
                        {#if post.description}
                            <p class="index-desc">{post.description}</p>
                        {/if}
                        <div class="index-meta">
                            <span>{formatDate(post.publishedAt)}</span>
                            {#if post.tags?.length}
                                <span class="index-meta-sep">·</span>
                                <span>{post.tags.slice(0, 3).join(" · ")}</span>
                            {/if}
                        </div>
                    </div>
                </li>
            {/each}
        </ol>
    {/if}
</section>

{#if recentShares.length > 0}
    <section aria-labelledby="shared-heading" class="band">
        <header class="band-header">
            <h2 id="shared-heading" class="band-title">
                Recently shared via <a href="https://skyreader.app">Skyreader</a>
            </h2>
            {#if hasMoreShares}
                <a href="/reading" class="read-more">all shares</a>
            {/if}
        </header>

        <ol class="shares">
            {#each recentShares as share}
                <li class="share">
                    <span class="share-date">
                        {new Date(share.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
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
                                {:else}
                                    <span class="share-cite-sep">·</span>
                                    <span class="share-cite-host">{hostOf(share.itemUrl)}</span>
                                {/if}
                            </p>
                        {:else}
                            <h3 class="share-title">
                                <a href={share.itemUrl} rel="noopener">
                                    {share.itemTitle || share.itemUrl}
                                </a>
                            </h3>
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
                    </div>
                </li>
            {/each}
        </ol>
    </section>
{/if}

<section aria-labelledby="workshop-heading" class="band">
    <header class="band-header">
        <h2 id="workshop-heading" class="band-title">Workshop</h2>
        <span class="band-sublabel">things I've made</span>
    </header>

    <ul class="stack">
        {#each projects as project}
            <li class="stack-item">
                <h3 class="stack-name">
                    <a href={project.href}>{project.name}</a>
                </h3>
                <p class="stack-blurb">{project.blurb}</p>
            </li>
        {/each}
    </ul>
</section>

<section aria-labelledby="papers-heading" class="band">
    <header class="band-header">
        <h2 id="papers-heading" class="band-title">Papers</h2>
        <a href="/papers" class="read-more">all papers</a>
    </header>

    <ul class="stack">
        {#each featuredPapers as paper}
            <li class="stack-item">
                <h3 class="stack-name">
                    <a href={`/papers/${paper.slug}`}>{paper.title}</a>
                </h3>
                <p class="stack-blurb">{paper.blurb}</p>
                <p class="stack-venue">
                    <span class="stack-venue-name">{paper.venue}</span>
                    <span class="stack-venue-sep" aria-hidden="true">·</span>
                    <span>{paper.year}</span>
                </p>
            </li>
        {/each}
    </ul>
</section>

<style>
    .intro {
        margin-bottom: var(--space-2xl);
    }

    /* ——— signals (social contact table) ——— */
    .signals {
        list-style: none;
        padding: 0;
        margin: 0;
        max-width: var(--measure);
        display: grid;
        gap: var(--space-2xs) var(--space-md);
        grid-template-columns: max-content 1fr;
        font-family: var(--font-mono);
        font-size: var(--type-sm);
        font-variant-numeric: tabular-nums;
    }

    .signal {
        display: contents;
    }

    .signal-label {
        font-family: var(--font-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.14em;
        text-transform: lowercase;
        color: var(--ink-muted);
        padding-top: 0.18em;
        align-self: baseline;
    }

    .signal-link {
        color: var(--ink-text);
        text-decoration: none;
        padding-bottom: 1px;
        border-bottom: 1px dotted var(--ink-rule);
        transition:
            color 120ms ease-out,
            border-color 120ms ease-out;
        justify-self: start;
    }

    .signal-link:hover,
    .signal-link:focus-visible {
        color: var(--ink-accent-hover);
        border-bottom-color: currentColor;
    }

    /* ——— band (home section rhythm) ——— */
    .band {
        margin-bottom: var(--space-2xl);
        max-width: var(--measure-wide);
    }

    .band-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
    }

    .band-title {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: var(--type-h2);
        letter-spacing: -0.01em;
        margin: 0;
        color: var(--ink-text);
    }

    .band-sublabel {
        font-family: var(--font-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.08em;
        text-transform: lowercase;
        color: var(--ink-muted);
    }

    /* ——— stack (project / featured paper list) ——— */
    .stack {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .stack-item {
        padding: var(--space-md) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
        display: grid;
        gap: var(--space-3xs);
    }

    .stack-item:last-child {
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    .stack-name {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: var(--type-lg);
        line-height: 1.25;
        letter-spacing: -0.005em;
        margin: 0;
    }

    .stack-name a {
        color: var(--ink-text);
        text-decoration: none;
    }

    .stack-name a:hover,
    .stack-name a:focus-visible {
        color: var(--ink-accent-hover);
    }

    .stack-blurb {
        color: var(--ink-text-soft);
        font-size: 1rem;
        line-height: 1.55;
        margin: 0;
        max-width: var(--measure);
    }

    .stack-venue {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
        margin: var(--space-3xs) 0 0;
        display: inline-flex;
        gap: 0.8ch;
        align-items: baseline;
    }

    .stack-venue-name {
        color: var(--ink-accent);
        text-transform: lowercase;
    }

    .stack-venue-sep {
        color: var(--ink-rule);
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

    /* ——— shares (marginalia band) ——— */
    .shares {
        list-style: none;
        padding: 0;
        margin: 0;
        max-width: var(--measure-wide);
    }

    .share {
        display: grid;
        grid-template-columns: 5ch 1fr;
        column-gap: var(--space-md);
        padding: var(--space-md) 0;
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
        line-height: 1.5;
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
        font-size: var(--type-lg);
        line-height: 1.3;
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
</style>
