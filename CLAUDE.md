## Design Context

This project has two distinct surfaces with deliberately different aesthetics:

- **Public site** — the blog at disnetdev.com. For readers.
- **Admin / drafting interface** — the private back office where Tim writes.

They share no typography and no palette. Each speaks in its own voice. Switching between them should feel like walking from the broadcast room into the private studio, or vice versa.

---

## Public Site

### Users

The public site is Tim's personal blog, a long-running (since 2011, 50+ posts) technical journal focused on programming-language design, macros, type systems, local-first software, and ATProto. Readers are other working technical people: compiler writers, language hobbyists, researchers, systems programmers, local-first enthusiasts. Many arrive from Hacker News, lobste.rs, or Mastodon/Bluesky links; a core subscribes via RSS and has followed the Sweet.js lineage for a decade.

Typical reading moment: a PR is building, a test is running, or it's a slow evening, and the reader settles in with a tab open to a 15-minute post about a topic they already care about. The site needs to reward that attention, not fight for it.

### Brand Personality

Three words: **rigorous, warm-lit, patient.**

Emotional goal: the reader has found a private workshop with the lights on, coffee nearby, the smell of warm electronics. Not a portfolio site, not a startup blog. The author takes ideas seriously and expects the reader to as well. No newsletter hooks, no engagement bait, no social proof in the margins. The work is the work.

### Aesthetic Direction

**Cathode paper.** A warm off-white reading surface, deep warm ink, and a single phosphor-amber accent that behaves like signal. Laid out with the structural rigor of an engineering notebook and the textual care of a literary journal. A deliberate contrast with the admin's writer's-studio stack.

- **Theme**: Light mode first (warm ecru/cream). Dark mode is warm umber, like a workshop at night, never a terminal bleeding onto black. `prefers-color-scheme` is respected end-to-end. Both modes must feel equally considered, not one as an afterthought.
- **Typography**: Serif-forward but distinct from the admin's Vollkorn/Literata. A display serif with a slight engineered edge paired with a warm humanist body serif. Monospace reserved for code and terminal-style meta (dates, line counts, prompt glyphs), never used for running text.
- **Hacker signal (slight, not shouted)**: The phosphor amber accent, the ▸ glyph used semantically (current page, continue reading, state markers), small-caps numerals in meta, hairline rules as structure, a compiler-status-line footer on long posts. No neon, no scanlines, no terminal-window chrome, no monospace-everywhere cosplay.
- **References**: Gwern.net's structural rigor, Fabien Sanglard's warm technical essays, Tufte's layout discipline, an amber CRT on a wood desk, Granta/The Baffler typographic care applied to PL writing.
- **Anti-references**: Cyberpunk dark themes (cyan-on-black, magenta glow), Medium/Substack templated posts, terminal-cosplay blogs, startup "what we're up to" pages, glassmorphic portfolio sites, newsletter-first reading surfaces.

### Design Principles

1. **Signal, not chrome.** The amber accent is rare and meaningful. When it appears, it marks a link, a state, a prompt. Overuse destroys its power.
2. **Structure is the ornament.** Hairline rules, aligned numerals, a visible typographic grid at section breaks, carefully set meta bars. Decoration comes from architectural precision, not applied texture.
3. **Prose is sovereign.** Long technical paragraphs read beautifully at ~68ch with generous leading. Code blocks sit in a quietly tinted surface but don't interrupt the voice. No framed terminals, no traffic-light buttons, no window chrome.
4. **Warm, even at night.** Dark mode preserves the warm hue so the site doesn't lose its personality in the switch. Surfaces stay umber and tobacco, never steel or navy.
5. **Respect the reader.** No modal captures, no newsletter popovers, no cookie theater beyond what's required. If they're here, they're here to read.

### Palette & Typography

- **Palette**: warm ecru surface, deep warm ink, warm gray mid-tones, phosphor-amber accent. All neutrals tinted toward the same warm hue (~70–80°). OKLCH only. Dark mode is warm umber, never navy or pure black.
- **Display**: Young Serif (Vinicius Aoqui). **Body/reading**: Alegreya variable. **Small UI / meta**: Alegreya Sans SC. **Code & terminal meta**: Commit Mono variable.
- All from Google Fonts / open source, self-hosted via `@fontsource`. No Inter, no IBM Plex.

---

## Admin / Drafting Interface

### Users

The drafting interface is used by one person — Tim, the site owner. He signs in via ATProto OAuth and lands here when he wants to write. The context is a private back office for a public personal blog: drafts get composed, refined, and eventually published to his PDS where they surface on the public site.

He is technical (deep in ATProto ecosystem, local-first apps) but the drafting context is not a debugging/dashboard session — it is a writing session. Typical moments: a free evening, a coffee in the morning, a thought he wants to hold onto. Not a trading desk, not a ticket queue.

### Brand Personality

Three words: **quiet, literary, considered.**

Emotional goal: walking into the room should feel like picking up a well-loved pen. Calm, not clinical. Inviting, not busy. No notifications, no dopamine hooks, no gamification of word count.

### Aesthetic Direction

**Writer's studio.** The private desk behind the broadcast. A deliberate contrast with the public site's cathode-paper stack.

- **Theme**: Light. Warm paper tones. Cream/off-white surfaces with deep ink text. Dark mode is not a priority here; this surface is designed for the morning light.
- **Typography**: Serif-forward. A literary display face for titles/headings; a generous reading face for body and editor; restrained mono only for meta/timestamps.
- **Writing is the hero**: The editor itself should feel like a place you want to be. Generous measure, proper leading, minimal chrome around the text. Dashboard simple and subordinate.
- **References**: iA Writer, Bear, Ulysses — the typography-first writing tool lineage.
- **Anti-references**: Notion admin panels, generic SaaS dashboards, CMS form-soup.

### Design Principles

1. **Reading is writing's twin.** The editor should be as pleasant to read as to type in.
2. **Chrome steps back.** Controls exist but recede when you're not reaching for them.
3. **Light hand, strong bones.** Minimal decoration, precise typographic hierarchy.
4. **One voice across views.** Dashboard and editor share palette, type family, and mood.
5. **Respect the writing.** Don't interrupt. Confirmation dialogs and toasts are rare and quiet.

### Palette & Typography

- **Palette**: warm off-white background, deep warm ink, warm gray mid-tones, one restrained accent. All neutrals tinted toward the same warm hue. OKLCH only.
- **Display**: Vollkorn (variable). **Body/editor**: Literata (variable). **Meta/small labels**: Fragment Mono (sparingly).
- All from Google Fonts, self-hosted via @fontsource. No Inter. No system-ui fallback aesthetic.

Full context in `.impeccable.md`.
