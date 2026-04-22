## Design Context

### Users

The drafting interface is used by one person — Tim, the site owner. He signs in via ATProto OAuth and lands here when he wants to write. The context is a private back office for a public personal blog: drafts get composed, refined, and eventually published to his PDS where they surface on the public site.

He is technical (deep in ATProto ecosystem, local-first apps) but the drafting context is not a debugging/dashboard session — it is a writing session. Typical moments: a free evening, a coffee in the morning, a thought he wants to hold onto. Not a trading desk, not a ticket queue.

The public-facing blog is technical-but-accessible and leans minimal and thoughtful. The drafting interface is the private studio behind it.

### Brand Personality

Three words: **quiet, literary, considered.**

Emotional goal: walking into the room should feel like picking up a well-loved pen. Calm, not clinical. Inviting, not busy. No notifications, no dopamine hooks, no gamification of word count.

### Aesthetic Direction

**Writer's studio — a deliberate departure from the public site's dark navy.**

- **Theme**: Light. Warm paper tones. Cream/off-white surfaces with deep ink text. (The public blog stays dark; this is the other side of the desk.)
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
