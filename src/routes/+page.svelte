<script lang="ts">
    import { page } from "$app/state";
    import { invalidateAll } from "$app/navigation";
    import { lensHref } from "$lib/lens/paths";
    import RepoScope from "$lib/components/lens/RepoScope.svelte";

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
        { name: "Radial", href: "https://radl.app", blurb: "Agent orchestration on the Atmosphere." },
        { name: "Skyreader", href: "https://skyreader.app", blurb: "An RSS reader on the Atmosphere." },
        { name: "Skyboard", href: "https://skyboard.dev", blurb: "A Kanban board on the Atmosphere." },
        { name: "SembleIt", href: "https://sembleit.dev", blurb: "An alternative client for Semble." },
        { name: "Flint", href: "https://www.flintnote.com", blurb: "A note-taking app." },
        { name: "Sweet.js", href: "https://sweetjs.org", blurb: "Hygienic macros for JavaScript." },
    ];

    const flight = $derived(data.inFlight);
    const me = "disnetdev.com";

    // The board is live: re-read the repo every minute while the tab is
    // visible, and mark anything that wasn't there on the last read.
    let seen: Set<string> | null = null;
    let fresh = $state<Set<string>>(new Set());
    let focused = $state<string | null>(null);

    $effect(() => {
        const uris = [...flight.underway, ...flight.landed].map((f) => f.uri);
        const before = seen;
        if (before) fresh = new Set(uris.filter((u) => !before.has(u)));
        seen = new Set(uris);
    });

    $effect(() => {
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") invalidateAll();
        }, 60_000);
        return () => clearInterval(timer);
    });

    function day(iso: string) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        const sameYear = d.getFullYear() === new Date().getFullYear();
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: sameYear ? undefined : "numeric",
        });
    }


    // A plan's progress as a row of type: ■ done, ▸ active or next, · waiting.
    const METER_WIDTH = 32;
    function meter(h: (typeof flight.horizon)[number]) {
        const moving = h.counts[0]?.n ?? 0;
        const waiting = h.total - h.done - moving;
        const scale = h.total > METER_WIDTH ? METER_WIDTH / h.total : 1;
        const cells = (n: number) => (n > 0 ? Math.max(1, Math.round(n * scale)) : 0);
        return {
            done: "■".repeat(cells(h.done)),
            moving: "▸".repeat(cells(moving)),
            waiting: "·".repeat(cells(waiting)),
        };
    }

    const isExternal = (href: string) => /^https?:\/\//.test(href);
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

<section class="hero" aria-labelledby="hero-heading">
    {#if data.scope}
        <div class="hero-scope">
            <RepoScope
                did={data.scope.did}
                pds={data.scope.pds}
                repo={data.scope.repo}
                collections={data.scope.collections}
                highlights={flight.underway.map((f) => ({
                    uri: f.uri,
                    label: f.callsign,
                    title: f.title,
                }))}
                bind:focused
                label="A radar of every record in my repo: bearing is the app, distance is age."
            />
        </div>
    {/if}

    <div class="hero-text">
        <h1 id="hero-heading" class="page-heading">Tim Disney</h1>
        <p class="page-lede">
            I make code and things. Programming languages, the web, and the <a
                href="https://atproto.com/">Atmosphere</a
            > bring me joy. The scope is my repo, read live from my PDS: every
            blip is a record, and the boxed ones are work in flight.
        </p>

        <h2 class="flights-heading">In flight</h2>
        {#if flight.underway.length === 0}
            <p class="empty">
                <span class="empty-prompt">▸</span> nothing in the air right now.
            </p>
        {:else}
            <ol class="flights">
                {#each flight.underway as f (f.uri)}
                    <li
                        class="flight"
                        class:is-focused={focused === f.uri}
                        class:is-fresh={fresh.has(f.uri)}
                        onpointerenter={() => (focused = f.uri)}
                    >
                        <span class="flight-sign">{f.callsign}</span>
                        <a class="flight-title" href={f.href} onfocus={() => (focused = f.uri)}
                            >{f.title}</a
                        >
                        <span class="flight-where">
                            {f.where}<span class="board-sep">·</span>{f.status}
                        </span>
                    </li>
                {/each}
            </ol>
        {/if}

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
    </div>
</section>

{#if flight.horizon.length > 0}
    <section aria-labelledby="horizon-heading" class="band">
        <header class="band-header">
            <h2 id="horizon-heading" class="band-title">On the horizon</h2>
            <span class="band-sublabel">
                <span class="meter-key">■</span> done
                <span class="meter-key meter-key--moving">▸</span> moving
                <span class="meter-key">·</span> waiting
            </span>
        </header>

        <ul class="horizon">
            {#each flight.horizon as h}
                {@const m = meter(h)}
                <li class="horizon-row">
                    <h3 class="horizon-name"><a href={h.href}>{h.name}</a></h3>
                    <p class="horizon-meter" aria-label={`${h.done} of ${h.total} done`}>
                        <span class="meter-done">{m.done}</span><span class="meter-moving"
                            >{m.moving}</span
                        ><span class="meter-waiting">{m.waiting}</span>
                    </p>
                    <p class="horizon-counts">
                        {h.done}/{h.total} done{#each h.counts.filter((c) => c.n > 0) as c}
                            <span class="board-sep">·</span>{c.n} {c.label}{/each}
                    </p>
                </li>
            {/each}
        </ul>
    </section>
{/if}

<section aria-labelledby="landed-heading" class="band">
    <header class="band-header">
        <h2 id="landed-heading" class="band-title">Landed</h2>
        <a href="/blog" class="read-more">all posts</a>
    </header>

    <ol class="log">
        {#each flight.landed as f (f.uri)}
            <li class="log-row" class:is-fresh={fresh.has(f.uri)}>
                <span class="log-when">{day(f.at)}</span>
                <span class="log-verb">{f.status}</span>
                <div class="log-body">
                    <a
                        class="log-title"
                        href={f.href}
                        rel={isExternal(f.href) ? "noopener" : undefined}>{f.title}</a
                    >
                    <span class="log-where">
                        {f.where}{#if f.via}<span class="board-sep">·</span>{f.via}{/if}
                    </span>
                </div>
                {#if f.image}
                    <img class="log-thumb" src={f.image} alt="" loading="lazy" decoding="async" />
                {/if}
            </li>
        {/each}
    </ol>
</section>

<section aria-labelledby="lens-heading" class="band lens-invite">
    <header class="band-header">
        <h2 id="lens-heading" class="band-title">The whole repo</h2>
    </header>
    <p class="lens-invite-copy">
        Everything on this page is read from public records in my repo. You
        can <a href={lensHref(me)}>browse all of it</a>, every collection from
        every app I use, down to the raw fields of each record.
    </p>
</section>

<section aria-labelledby="workshop-heading" class="band">
    <header class="band-header">
        <h2 id="workshop-heading" class="band-title">Workshop</h2>
        <a href="/papers" class="read-more">papers</a>
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

<style>

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

    /* ——— hero: the scope beside the name and the work in flight ——— */
    .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
        gap: var(--space-lg);
        align-items: start;
        margin: 0 0 var(--space-3xl);
    }

    .hero-scope {
        position: sticky;
        top: var(--space-lg);
    }

    .hero-text .page-lede {
        font-size: var(--type-base);
        margin-bottom: var(--space-lg);
    }

    .flights-heading {
        font-family: var(--font-meta);
        font-weight: 500;
        font-size: var(--type-sm);
        letter-spacing: 0.14em;
        text-transform: lowercase;
        color: var(--ink-muted);
        margin: 0 0 var(--space-2xs);
    }

    .flights {
        list-style: none;
        margin: 0 0 var(--space-lg);
        padding: 0;
        border-top: var(--rule) solid var(--ink-rule);
    }

    .flight {
        display: grid;
        grid-template-columns: 9ch minmax(0, 1fr);
        grid-template-areas:
            "sign title"
            ". where";
        column-gap: var(--space-sm);
        padding: var(--space-2xs) var(--space-2xs) var(--space-2xs) 0;
        border-bottom: var(--rule) solid var(--ink-rule-soft);
        transition: background-color 160ms ease-out;
    }

    .flight-sign {
        grid-area: sign;
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        letter-spacing: 0.04em;
        color: var(--ink-muted);
        padding-top: 0.3em;
        transition: color 160ms ease-out;
    }

    :global(.cathode-main) .flight-title {
        grid-area: title;
        color: var(--ink-text);
        text-decoration: none;
        line-height: 1.35;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .flight-where {
        grid-area: where;
        font-family: var(--font-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.06em;
        text-transform: lowercase;
        color: var(--ink-muted);
    }

    /* The row the scope is tracking. */
    .flight.is-focused {
        background: linear-gradient(
            to right,
            oklch(from var(--ink-accent) l c h / 0.12),
            transparent 70%
        );
    }

    .flight.is-focused .flight-sign {
        color: var(--ink-accent);
    }

    :global(.cathode-main) .flight.is-focused .flight-title,
    :global(.cathode-main) .flight-title:hover,
    :global(.cathode-main) .flight-title:focus-visible {
        color: var(--ink-accent-hover);
    }

    @media (max-width: 56rem) {
        .hero {
            grid-template-columns: minmax(0, 1fr);
            gap: var(--space-lg);
        }

        .hero-scope {
            position: static;
            max-width: 34rem;
            width: 100%;
            justify-self: center;
        }
    }

    .board-sep {
        color: var(--ink-rule);
        margin: 0 0.6ch;
    }

    /* A row that appeared since the last read glows once, like a phosphor. */
    .is-fresh {
        animation: fresh-glow 2.8s ease-out;
    }

    @keyframes fresh-glow {
        from {
            background: oklch(from var(--ink-accent) l c h / 0.18);
        }
        to {
            background: transparent;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .is-fresh {
            animation: none;
        }
    }

    /* ——— horizon (plans as meters) ——— */
    .horizon {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .horizon-row {
        display: grid;
        grid-template-columns: minmax(12rem, 1fr) auto;
        grid-template-areas:
            'name counts'
            'meter meter';
        gap: var(--space-3xs) var(--space-md);
        padding: var(--space-sm) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .horizon-row:last-child {
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    .horizon-name {
        grid-area: name;
        font-family: var(--font-body);
        font-weight: 500;
        font-size: 1.05rem;
        margin: 0;
    }

    .horizon-name a {
        color: var(--ink-text);
        text-decoration: none;
    }

    .horizon-name a:hover,
    .horizon-name a:focus-visible {
        color: var(--ink-accent-hover);
    }

    .horizon-counts {
        grid-area: counts;
        margin: 0;
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        font-variant-numeric: tabular-nums;
        align-self: baseline;
    }

    .horizon-meter {
        grid-area: meter;
        margin: 0;
        font-family: var(--font-mono);
        font-size: var(--type-sm);
        letter-spacing: 0.18em;
        line-height: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .meter-done {
        color: var(--ink-text-soft);
    }

    .meter-moving,
    .meter-key--moving {
        color: var(--ink-accent);
    }

    .meter-waiting {
        color: var(--ink-muted);
    }

    .meter-key {
        font-family: var(--font-mono);
        margin-left: 0.8ch;
    }

    /* ——— log (landed) ——— */
    .log {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .log-row {
        display: grid;
        grid-template-columns: 7ch 11ch 1fr auto;
        gap: var(--space-sm);
        align-items: baseline;
        padding: var(--space-xs) 0;
        border-top: var(--rule) solid var(--ink-rule-soft);
    }

    .log-row:last-child {
        border-bottom: var(--rule) solid var(--ink-rule-soft);
    }

    .log-when {
        font-family: var(--font-mono);
        font-size: var(--type-xs);
        color: var(--ink-muted);
        font-variant-numeric: tabular-nums;
    }

    .log-verb {
        font-family: var(--font-meta);
        font-size: var(--type-sm);
        letter-spacing: 0.08em;
        color: var(--ink-accent);
    }

    .log-body {
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0 var(--space-xs);
        align-items: baseline;
    }

    :global(.cathode-main) .log-title {
        color: var(--ink-text);
        text-decoration: none;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    :global(.cathode-main) .log-title:hover,
    :global(.cathode-main) .log-title:focus-visible {
        color: var(--ink-accent-hover);
    }

    .log-where {
        font-family: var(--font-meta);
        font-size: var(--type-xs);
        letter-spacing: 0.08em;
        text-transform: lowercase;
        color: var(--ink-muted);
    }

    .log-thumb {
        width: 2.5rem;
        height: 2.5rem;
        object-fit: cover;
        border-radius: 2px;
        align-self: center;
    }

    @media (max-width: 40rem) {

        .log-row {
            grid-template-columns: 7ch 1fr auto;
            grid-template-areas:
                'when verb thumb'
                'body body thumb';
            gap: var(--space-3xs) var(--space-sm);
        }

        .log-when {
            grid-area: when;
        }

        .log-verb {
            grid-area: verb;
        }

        .log-body {
            grid-area: body;
        }

        .log-thumb {
            grid-area: thumb;
        }

        .horizon-row {
            grid-template-columns: 1fr;
            grid-template-areas:
                'name'
                'meter'
                'counts';
        }
    }

    /* ——— lens invite ——— */
    .lens-invite-copy {
        max-width: var(--measure);
        margin: 0 0 var(--space-md);
        color: var(--ink-text-soft);
    }
</style>
