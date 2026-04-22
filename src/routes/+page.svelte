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
</style>
