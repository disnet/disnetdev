# Drafts

Unpublished posts live here, one markdown file each. Merging a draft into
`main` publishes it to the site.standard publication on Tim's PDS and
redeploys the site (see `.github/workflows/deploy.yml` and
`scripts/publish-drafts.mjs`).

## Format

```markdown
---
title: "The post title"
description: One sentence for feeds, cards and the post header.
tags: [macros, atproto]
# slug: optional; defaults to the file name
# coverImage: img/cover.png   optional, path relative to this file
# draft: true                 optional; merged but held back from publishing
---

Body in GitHub-flavored markdown. Footnotes work[^1].

![Alt text](img/screenshot.png)

[^1]: Like this.
```

- File name is the slug: `drafts/my-post-title.md` publishes at
  `/blog/my-post-title`. Lowercase words joined by hyphens.
- Put images in `drafts/img/` and link them relatively. They are uploaded as
  blobs on publish and the links are rewritten to `blob:<cid>`.
- `draft: true` lets a post sit on `main` without publishing.

## Lifecycle

1. A draft goes up as a pull request. The **Drafts check** workflow validates
   frontmatter, slugs and image paths.
2. Review the prose in the PR.
3. Merge. The deploy workflow publishes the post, moves the file to
   `content/published/<slug>.md` with the record's `uri`, and builds the site.

To edit a post after it is published, use the studio at `/admin`.

## Local commands

```bash
npm run drafts:check     # validate, no network
npm run drafts:publish   # publish for real (needs ATP_IDENTIFIER, ATP_APP_PASSWORD)
```
