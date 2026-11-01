## Drafting and publishing posts

Posts are `site.standard.document` records on Tim's PDS, in the publication at
`PUBLICATION_AT_URI`. The public site prerenders from those records, so the
website and the standard.site pub are the same thing.

When asked to draft a post:

1. Write it as `drafts/<slug>.md` on a branch, following `drafts/README.md`
   (frontmatter `title`, `description`, `tags`; images in `drafts/img/`).
2. Run `npm run drafts:check` before pushing.
3. Open a PR. Tim reviews the prose there. Never merge it yourself: merging
   publishes to the PDS, which is public and outlives the repo.
4. On merge, `.github/workflows/deploy.yml` publishes the draft, moves it to
   `content/published/`, and rebuilds the site.

Writing it: match the voice of recent posts in `content/blog/` and
`content/published/` (first person, plain, specific, no filler intros or
listicle headings). Draft from Tim's notes, outline, or thinking; don't invent
opinions or experiences he hasn't stated. Flag gaps with `<!-- TODO: ... -->`
rather than papering over them. The check fails while any remain, so a draft
with open questions can't be merged by accident.

Edits to an already-published post go through the studio at `/admin`, not
this flow.

---

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

Three words: **rigorous, direct, personal.**

Emotional goal: a working researcher's marked-up proof sheet. Bold heads, sturdy text, the occasional stroke of an editor's blue pencil. Deliberately not the warm-cream-and-amber look AI-generated blogs default to. No newsletter hooks, no engagement bait. The work is the work.

### Aesthetic Direction

**Blue pencil.** Bright bond paper, blue-black ink, one ultramarine accent used like an editor's mark (macros rewrite code; the blue pencil rewrites prose).

- **Theme**: Light first (cool bond paper, never cream). Dark mode is a blue-black ink well, never pure black or neon. `prefers-color-scheme` respected end-to-end.
- **Marks**: 5px pencil stripe across the top, 2px ink rules over section heads, small solid accent squares as markers, a solid accent block for subscribe, plain arrows (→ ←). Square corners. No ▸ glyphs, no `$` prompts, no terminal cosplay.
- **Anti-references**: cream + amber/terracotta "AI default" blogs, cyberpunk dark themes, Medium/Substack templates, glassmorphic portfolios.

### Design Principles

1. **One pencil.** Ultramarine is the only color: link underlines, current page, markers, subscribe. Never body text.
2. **Structure is the ornament.** Heavy ink rules at section breaks, hairlines between entries, aligned mono numerals.
3. **Prose is sovereign.** ~68ch, generous leading, code on a tinted surface under an ink rule.
4. **Respect the reader.** No modals, no popovers beyond the subscribe control.

### Palette & Typography

- **Palette**: bond paper, blue-black ink, blue-tinted grays (~255–268°), ultramarine `oklch(0.49 0.22 270)` accent. OKLCH only.
- **Display / UI**: Schibsted Grotesk variable. **Body/reading**: Piazzolla variable. **Code & machine meta**: Martian Mono variable (87.5% width).
- All self-hosted via `@fontsource-variable`. No Inter, no IBM Plex.

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
