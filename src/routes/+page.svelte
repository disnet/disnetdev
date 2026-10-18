<script lang="ts">
    import { page } from "$app/state";

    let { data } = $props();

    const ogImage = $derived(new URL("/og", page.url.origin).toString());
    const pageUrl = $derived(new URL("/", page.url.origin).toString());

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
            name: "Skyreader",
            href: "https://skyreader.app",
            blurb: "An RSS reader on the Atmosphere",
        },
        {
            name: "Skyboard",
            href: "https://skyboard.dev",
            blurb: "A Kanban board on the Atmosphere",
        },
        {
            name: "SembleIt",
            href: "https://sembleit.dev",
            blurb: "An alternative client for Semble",
        },
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
    const recentReading = $derived(data.reading);
    const hasMoreReading = $derived(data.readingTotal > data.reading.length);
    const recentCards = $derived(data.cards);
    const hasMoreCards = $derived(data.cardsTotal > data.cards.length);
    const recentPhotos = $derived(data.photos);

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

    {#if data.publication.uri}
        <link rel="site.standard.publication" href={data.publication.uri} />
        <meta name="at:canonical" content={data.publication.uri} />
    {/if}
    {#if data.authorDid}
        <meta name="at:author" content={`at://${data.authorDid}`} />
    {/if}

    <meta property="og:type" content="website" />
    <meta property="og:title" content={data.publication.record.name} />
    <meta
        property="og:description"
        content={data.publication.record.description ?? ""}
    />
    <meta property="og:url" content={pageUrl} />
    <meta property="og:site_name" content="disnetdev" />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="disnetdev — a language workshop, since 2011" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={data.publication.record.name} />
    <meta
        name="twitter:description"
        content={data.publication.record.description ?? ""}
    />
    <meta name="twitter:image" content={ogImage} />
</svelte:head>

<section class="intro">
    <h1 class="intro-name">Tim Disney</h1>
    <p class="intro-lede">
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

<div class="home-grid">
<section aria-labelledby="recent-heading" class="band band--posts">
    <header class="band-header">
        <h2 id="recent-heading" class="band-title">Recent posts</h2>
        {#if hasMorePosts}
            <a href="/blog" class="read-more">all posts</a>
        {/if}
    </header>

    {#if recentPosts.length === 0}
        <p class="empty">
            <span class="empty-prompt">→</span> the transmitter is warm but quiet. the first
            post from the new stack is on its way.
        </p>
    {:else}
        <ol class="lead">
            {#each recentPosts as post}
                <li class="lead-entry">
                    <time class="lead-date" datetime={post.publishedAt}>
                        <span class="lead-day"
                            >{new Date(post.publishedAt).getDate()}</span
                        >
                        <span class="lead-month">
                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                            })}
                        </span>
                    </time>
                    <div class="lead-body">
                        <h3 class="lead-title">
                            <a href={post.path}>{post.title}</a>
                        </h3>
                        {#if post.description}
                            <p class="lead-desc">{post.description}</p>
                        {/if}
                        {#if post.tags?.length}
                            <p class="lead-tags">{post.tags.slice(0, 3).join(" · ")}</p>
                        {/if}
                    </div>
                </li>
            {/each}
        </ol>
    {/if}
</section>

{#if recentPhotos.length > 0}
    <section aria-labelledby="photos-heading" class="band band--photos">
        <header class="band-header">
            <h2 id="photos-heading" class="band-title">
                Recent photos
            </h2>
            <a href="/photos" class="read-more">all photos</a>
        </header>

        <ol class="photo-strip">
            {#each recentPhotos as photo}
                <li class="photo-strip-item">
                    <a class="photo-strip-link" href={photo.url} rel="noopener">
                        <img
                            src={photo.images[0].thumb}
                            alt={photo.images[0].alt}
                            loading="lazy"
                            decoding="async"
                        />
                        <span class="photo-strip-date">
                            {new Date(photo.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </a>
                </li>
            {/each}
        </ol>
    </section>
{/if}

{#if recentReading.length > 0}
    <section aria-labelledby="shared-heading" class="band band--shares">
        <header class="band-header">
            <h2 id="shared-heading" class="band-title">
                Recently shared via <a href="https://skyreader.app">Skyreader</a>
            </h2>
            {#if hasMoreReading}
                <a href="/reading" class="read-more">all shares</a>
            {/if}
        </header>

        <ol class="shares">
            {#each recentReading as entry}
                <li class="share">
                    <span class="share-date">
                        {new Date(entry.sortedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                    <div class="share-body">
                        {#if entry.kind === "post"}
                            {@const post = entry.post}
                            <h3 class="share-title">
                                <a href={post.path}>{post.title}</a>
                            </h3>
                            <p class="share-meta">
                                {#if post.sourceUrl}
                                    <span class="share-cite-host"
                                        >{hostOf(post.sourceUrl)}</span
                                    >
                                    <span class="share-cite-sep">·</span>
                                {/if}
                                <a class="share-more" href={post.path}>notes →</a>
                            </p>
                        {:else}
                            {@const share = entry.share}
                            {#if share.note}
                                <p class="share-note">{share.note}</p>
                                <p class="share-cite">
                                    <span class="share-cite-glyph" aria-hidden="true">→</span>
                                    <a
                                        class="share-cite-link"
                                        href={share.itemUrl}
                                        rel="noopener"
                                    >
                                        {share.itemTitle || share.itemUrl}
                                    </a>
                                    {#if share.itemAuthor}
                                        <span class="share-cite-sep">·</span>
                                        <span class="share-cite-author"
                                            >{share.itemAuthor}</span
                                        >
                                    {:else}
                                        <span class="share-cite-sep">·</span>
                                        <span class="share-cite-host"
                                            >{hostOf(share.itemUrl)}</span
                                        >
                                    {/if}
                                </p>
                            {:else}
                                <h3 class="share-title">
                                    <a href={share.itemUrl} rel="noopener">
                                        {share.itemTitle || share.itemUrl}
                                    </a>
                                </h3>
                                <p class="share-meta">
                                    {#if share.itemAuthor}
                                        <span>{share.itemAuthor}</span>
                                        <span class="share-cite-sep">·</span>
                                    {/if}
                                    <span class="share-cite-host"
                                        >{hostOf(share.itemUrl)}</span
                                    >
                                </p>
                            {/if}
                        {/if}
                    </div>
                </li>
            {/each}
        </ol>
    </section>
{/if}

{#if recentCards.length > 0}
    <section aria-labelledby="filed-heading" class="band band--filed">
        <header class="band-header">
            <h2 id="filed-heading" class="band-title">
                Recently filed in the <a href="/library">library</a>
            </h2>
            {#if hasMoreCards}
                <a href="/library" class="read-more">all cards</a>
            {/if}
        </header>

        <ol class="filed">
            {#each recentCards as card}
                <li class="filed-item">
                    <span class="filed-mark" aria-hidden="true">■</span>
                    <div class="filed-body">
                        <h3 class="filed-title">
                            <a href={card.url} rel="noopener">
                                {card.title || card.url}
                            </a>
                        </h3>
                        <p class="filed-meta">
                            <span class="filed-meta-host">
                                {card.siteName || hostOf(card.url)}
                            </span>
                            {#if card.author}
                                <span class="filed-meta-sep">·</span>
                                <span class="filed-meta-author">{card.author}</span>
                            {/if}
                        </p>
                    </div>
                </li>
            {/each}
        </ol>
    </section>
{/if}

<section aria-labelledby="workshop-heading" class="band band--workshop">
    <header class="band-header">
        <h2 id="workshop-heading" class="band-title">Workshop</h2>
        <span class="band-sublabel">things I've made</span>
    </header>

    <ul class="stack stack--grid">
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

<section aria-labelledby="papers-heading" class="band band--papers">
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
</div>

<style>
    /* ——— intro: the name set at poster scale, lede beside it ——— */
    .intro {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-md);
        margin-bottom: var(--space-2xl);
    }

    .intro-name {
        font-family: var(--font-display);
        font-weight: 830;
        font-size: clamp(3.4rem, 1.2rem + 8.4vw, 6rem);
        letter-spacing: -0.04em;
        line-height: 0.88;
        margin: 0;
        color: var(--ink-text);
    }

    .intro-lede {
        font-size: clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem);
        line-height: 1.4;
        color: var(--ink-text-soft);
        margin: 0;
        max-width: 34ch;
        text-wrap: pretty;
    }

    /* ——— signals (contact dateline) ——— */
    .signals {
        list-style: none;
        padding: var(--space-sm) 0 0;
        margin: var(--space-sm) 0 0;
        border-top: var(--rule) solid var(--ink-rule);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
        gap: var(--space-sm) var(--space-lg);
        font-family: var(--font-mono);
        font-size: var(--type-sm);
    }

    .signal {
        display: grid;
        gap: var(--space-3xs);
        min-width: 0;
    }

    .signal-label {
        font-family: var(--font-meta);
        font-weight: var(--weight-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ink-muted);
    }

    .signal-link {
        color: var(--ink-text);
        text-decoration: none;
        justify-self: start;
        overflow-wrap: anywhere;
        transition: color 120ms ease-out;
    }

    .signal-link:hover,
    .signal-link:focus-visible {
        color: var(--ink-accent-hover);
    }

    @media (min-width: 64rem) {
        .intro {
            grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
            column-gap: var(--space-xl);
            align-items: end;
        }

        .intro-lede {
            padding-bottom: 0.4rem;
        }

        .signals {
            grid-column: 1 / -1;
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }
    }

    /* ——— home grid: a lead column and a narrower side column, newspaper-style ——— */
    .home-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-2xl) var(--space-xl);
    }

    @media (min-width: 64rem) {
        .home-grid {
            grid-template-columns: repeat(12, minmax(0, 1fr));
            row-gap: var(--space-3xl);
        }

        .band--posts,
        .band--shares,
        .band--workshop {
            grid-column: 1 / span 8;
        }

        .band--photos,
        .band--filed,
        .band--papers {
            grid-column: 9 / span 4;
        }
    }

    /* Section heads hang off a heavy ink rule. */
    .band-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-md);
        margin-bottom: var(--space-xs);
        padding-top: var(--space-xs);
        border-top: 2px solid var(--ink-text);
    }

    .band-title {
        font-family: var(--font-display);
        font-weight: var(--weight-display);
        font-size: var(--type-h2);
        letter-spacing: -0.03em;
        line-height: 1.1;
        margin: 0;
        color: var(--ink-text);
    }

    /* The side column speaks a size down. */
    .band--photos .band-title,
    .band--filed .band-title,
    .band--papers .band-title {
        font-size: var(--type-xl);
    }

    /* The lead section carries the heaviest rule on the page. */
    .band--posts .band-header {
        border-top-width: 5px;
    }

    .band-sublabel {
        font-family: var(--font-meta);
        font-weight: var(--weight-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ink-muted);
    }

    /* ——— lead (recent posts as a dated ledger) ——— */
    .lead {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .lead-entry {
        display: grid;
        grid-template-columns: 4.5rem minmax(0, 1fr);
        column-gap: var(--space-md);
        padding: var(--space-md) 0 var(--space-lg);
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .lead-entry:first-child {
        border-top: 0;
    }

    .lead-date {
        display: grid;
        align-content: start;
        gap: var(--space-3xs);
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        color: var(--ink-muted);
    }

    .lead-day {
        font-size: 2.5rem;
        font-weight: 300;
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--ink-text);
    }

    .lead-month {
        font-size: var(--type-xs);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .lead-body {
        display: grid;
        gap: var(--space-2xs);
        max-width: var(--measure);
    }

    .lead-title {
        font-family: var(--font-display);
        font-weight: 760;
        font-size: clamp(1.6rem, 1.1rem + 1.6vw, 2.5rem);
        line-height: 1.02;
        letter-spacing: -0.035em;
        margin: 0;
        text-wrap: balance;
    }

    .lead-title a {
        color: var(--ink-text);
        text-decoration: underline;
        text-decoration-color: transparent;
        text-decoration-thickness: 3px;
        text-underline-offset: 0.12em;
        transition:
            color 150ms ease-out,
            text-decoration-color 150ms ease-out;
    }

    .lead-title a:hover,
    .lead-title a:focus-visible {
        color: var(--ink-text);
        text-decoration-color: var(--ink-accent);
    }

    .lead-desc {
        font-size: var(--type-lg);
        line-height: 1.45;
        color: var(--ink-text-soft);
        margin: 0;
    }

    .lead-tags {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
        margin: 0;
    }

    @media (max-width: 40rem) {
        .lead-entry {
            grid-template-columns: minmax(0, 1fr);
            row-gap: var(--space-2xs);
        }

        .lead-date {
            display: flex;
            align-items: baseline;
            gap: 1ch;
        }

        .lead-day {
            font-size: 1.5rem;
        }
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

    .stack-item:first-child {
        border-top: 0;
    }

    /* Workshop: two columns of projects, names set a size up. */
    .stack--grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
        column-gap: var(--space-xl);
    }

    .stack--grid .stack-item:nth-child(2) {
        border-top: 0;
    }

    @media (max-width: 40rem) {
        .stack--grid .stack-item:nth-child(2) {
            border-top: var(--rule) solid var(--ink-rule-soft);
        }
    }

    .stack--grid .stack-name {
        font-size: var(--type-xl);
        letter-spacing: -0.025em;
    }

    .stack-name {
        font-family: var(--font-display);
        font-weight: var(--weight-display);
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
        text-transform: uppercase;
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

    /* ——— photos: one large frame over two small ones ——— */
    .photo-strip {
        list-style: none;
        padding: 0;
        margin: var(--space-xs) 0 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-sm) var(--space-xs);
    }

    .photo-strip-item {
        min-width: 0;
    }

    .photo-strip-item:first-child {
        grid-column: 1 / -1;
    }

    .photo-strip-link {
        display: grid;
        gap: var(--space-3xs);
        color: inherit;
        text-decoration: none;
    }

    .photo-strip-link img {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        background: var(--ink-surface);
        transition: filter 200ms ease-out;
    }

    .photo-strip-item:first-child img {
        aspect-ratio: 4 / 3;
    }

    .photo-strip-date {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
    }

    .photo-strip-link:hover .photo-strip-date,
    .photo-strip-link:focus-visible .photo-strip-date {
        color: var(--ink-accent-hover);
    }

    .photo-strip-link:hover img,
    .photo-strip-link:focus-visible img {
        filter: contrast(1.06) saturate(1.1);
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
        grid-template-columns: 4.5rem minmax(0, 1fr);
        column-gap: var(--space-md);
        padding: var(--space-md) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .share:first-child {
        border-top: 0;
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
        font-weight: var(--weight-meta);
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
        font-weight: var(--weight-display);
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

    .share-meta {
        font-family: var(--font-meta);
        font-weight: var(--weight-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.04em;
        color: var(--ink-muted);
        margin: 0;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5ch;
    }

    .share-more {
        font-family: var(--font-meta);
        font-weight: var(--weight-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.04em;
        color: var(--ink-text-soft);
        text-decoration: none;
        transition: color 120ms ease-out;
    }

    .share-more:hover,
    .share-more:focus-visible {
        color: var(--ink-accent-hover);
    }

    /* ——— filed (recently filed library cards) ——— */
    .filed {
        list-style: none;
        padding: 0;
        margin: 0;
        max-width: var(--measure-wide);
    }

    .filed-item {
        display: grid;
        grid-template-columns: 1.5ch 1fr;
        column-gap: var(--space-sm);
        padding: var(--space-sm) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .filed-item:first-child {
        border-top: 0;
    }

    .filed-mark {
        color: var(--ink-accent);
        font-size: 0.7em;
        padding-top: 0.75em;
        line-height: 1;
        user-select: none;
    }

    .filed-body {
        display: grid;
        gap: var(--space-3xs);
        max-width: var(--measure);
        min-width: 0;
    }

    .filed-title {
        font-family: var(--font-display);
        font-weight: var(--weight-display);
        font-size: var(--type-lg);
        line-height: 1.3;
        letter-spacing: -0.005em;
        margin: 0;
    }

    .filed-title a {
        color: var(--ink-text);
        text-decoration: none;
        overflow-wrap: anywhere;
    }

    .filed-title a:hover,
    .filed-title a:focus-visible {
        color: var(--ink-accent-hover);
    }

    .filed-meta {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        letter-spacing: 0.04em;
        margin: 0;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5ch;
        font-variant-numeric: tabular-nums;
    }

    .filed-meta-sep {
        color: var(--ink-rule);
    }

    .filed-meta-author {
        color: var(--ink-text-soft);
    }

</style>
