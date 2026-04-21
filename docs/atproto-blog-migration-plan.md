# ATProto Blog Migration Plan

## Goal

Replace the current Eleventy blog with a SvelteKit site where:

- the ATProto repo is the canonical backend
- published posts are stored as `site.standard.document` records
- the site itself is represented by a `site.standard.publication` record
- you can log in with your Bluesky account to create/edit/publish posts
- drafts also live in the repo
- images/assets are stored as PDS blobs
- public pages are cached
- a one-time importer migrates existing markdown posts from this repo
- migration is a big-bang cutover

This is a single-author, markdown-first, blog-only system.

---

## What the actual standards.site lexicons require

I checked the live lexicons from the `standard.site` repo.

### `site.standard.publication`
Record key: `tid`

Required fields:
- `url: string` URI
- `name: string`

Optional fields:
- `icon: blob`
- `description: string`
- `basicTheme: ref(site.standard.theme.basic)`
- `labels`
- `preferences.showInDiscover: boolean`

### `site.standard.document`
Record key: `tid`

Required fields:
- `site: string` URI
- `title: string`
- `publishedAt: string` datetime

Optional fields:
- `path: string`
- `description: string`
- `tags: string[]`
- `content: open union`
- `textContent: string`
- `updatedAt: string`
- `coverImage: blob`
- `contributors`
- `labels`
- `links`
- `bskyPostRef`

### Important implication
`site.standard.document` is explicitly a published document model. It does **not** have a draft/status field, and `publishedAt` is required.

So the correct design is:
- **published posts** use `site.standard.document`
- **drafts** use a small **app-specific draft collection** in your repo

That keeps published content standards.site-native without abusing the spec.

---

## Locked decisions

### Authoring
- Single author only
- Access controlled by your DID

### Content state
- `draft`
- `published`

### Content format
- Markdown-first in v1
- Published records use `site.standard.document`
- Drafts use an app-specific draft record
- Markdown content is stored in a custom content schema carried inside the document `content` field

### URLs
- Preserve existing URLs where possible
- Use `document.path` for canonical route paths
- Build a slug mapping during import to catch irregular historical filenames

### Media
- Images uploaded as ATProto blobs to the PDS
- New post images use document `coverImage` or blob refs inside markdown content
- Imported inline image paths are rewritten during migration where feasible

### Admin UX
- Minimal `/admin`
- List drafts/published
- Create
- Edit
- Publish/unpublish
- Delete

### Scope exclusions for v1
- comments
- replies/discussions
- multi-author
- collaborative editing
- rich block editor
- social features beyond publishing

### Deployment
- Netlify

### OG handling
- Keep OG simple in v1

### Migration style
- Big-bang cutover

---

## Recommended architecture

### Canonical storage
The ATProto repo stores:
- one `site.standard.publication` record for the blog
- published posts as `site.standard.document`
- drafts in a custom draft collection
- blob references for images
- metadata needed for rendering and import tracking

### Web app
SvelteKit handles:
- public rendering
- post lookup by path/slug
- markdown rendering
- authenticated admin UI
- ATProto write operations
- caching layer
- feed/sitemap generation
- standards.site verification endpoints/tags

### One-time migration
A Node script:
- reads `content/blog/*.md`
- parses frontmatter
- uploads referenced local images as blobs
- creates published `site.standard.document` records
- writes a manifest of imported mappings

---

## Data model direction

## 1. Publication record
Create one `site.standard.publication` record for the site.

Planned fields:
- `url = https://your-domain`
- `name`
- `description`
- `icon`
- optional `basicTheme`

This publication AT-URI becomes:
- the `site` value for published documents
- the value returned at `/.well-known/site.standard.publication`

## 2. Published post record
Published posts use `site.standard.document`.

Planned field usage:
- `site`: AT-URI of the publication record
- `title`
- `publishedAt`
- `path`: canonical path like `/blog/my-post`
- `description`
- `tags`
- `content`: custom markdown content object
- `textContent`: plain text extracted from markdown
- `updatedAt`
- `coverImage`
- `contributors`: optional, likely just you or omitted in v1

## 3. Draft record
Drafts should **not** use `site.standard.document`.

Instead use a custom collection, e.g.:
- `dev.disnet.blog.draft`

Draft fields:
- `title`
- `slug`
- `description`
- `tags`
- `markdown`
- `createdAt`
- `updatedAt`
- `coverImage?`
- optional import/legacy metadata

When publishing:
1. read draft
2. create `site.standard.document`
3. optionally delete draft, or mark it as linked to the published record

## 4. Markdown content format
The `site.standard.document.content` field is an **open union** and does not define markdown itself.

So v1 should define a tiny app lexicon for markdown content, e.g.:
- `dev.disnet.blog.content.markdown`

That content object should include:
- `markdown: string`
- optional inline image metadata if needed

This is standards.site-compatible because the document allows extension via open union.

---

## Record key strategy

Use stable generated record keys that are not slugs.

### For publication
- `tid` per standards.site

### For published documents
- `tid` per standards.site

### For drafts
- generated stable key in the custom collection

### Why
If a slug changes:
- published record identity stays stable
- edit URLs stay stable
- redirects are easier later

Public routes still use `/blog/[slug]`, but the canonical value in the record is `path`.

---

## URL strategy

### Preserve current URLs where possible
The current repo contains irregular filenames and slugs, including spaces and punctuation.

### Standards.site mapping
Use `site.standard.document.path` as the canonical route path.

Examples:
- `/blog/skyreader-rss-on-at-protocol`
- `/blog/never-forgive`

### Importer behavior
For each imported post, compute and store:
- `legacyPath`
- `finalPath`
- `slug`
- optional redirect aliases

### Rules
1. Preserve current production URL when it can be inferred reliably
2. Set document `path` to that canonical path
3. If a cleaner path is later chosen, use redirects rather than changing history silently

The importer writes a manifest mapping source files to final paths and AT URIs.

---

## Authentication and authorization

### Goal
Log in with Bluesky account and allow editing only for the configured author DID.

### Recommendation
Use ATProto OAuth for web login.

### Flow
1. User clicks sign in
2. Redirect through ATProto OAuth
3. App receives authenticated session
4. App checks resolved DID
5. If DID matches configured author DID, unlock `/admin`
6. Otherwise deny admin access

### Authorization rule
Configure:

```env
AUTHOR_DID=did:plc:...
```

Only this DID can:
- create drafts
- edit drafts
- publish drafts
- edit published posts
- upload blobs
- unpublish/delete content

---

## Public site architecture

### Public routes
- `/`
- `/blog`
- `/blog/[slug]`
- `/archive`
- `/feed.xml`
- `/sitemap.xml`

### Admin routes
- `/admin`
- `/admin/new`
- `/admin/edit/draft/[rkey]`
- `/admin/edit/post/[rkey]`
- delete handled as a form action on edit page

### Rendering model
Use SSR on Netlify for public pages with cache headers.

Why not static export:
- content lives remotely in the repo
- admin writes happen outside build time
- it simplifies freshness after publish/update

---

## standards.site verification requirements

### Publication verification
Serve:
- `/.well-known/site.standard.publication`

Response body:
- the AT-URI of your `site.standard.publication` record

### Document verification
Each published post page should emit:

```html
<link rel="site.standard.document" href="at://did:.../site.standard.document/rkey">
```

This should be generated from the actual loaded document URI.

---

## Content rendering strategy

### Markdown pipeline
Use a markdown renderer in SvelteKit that supports:
- headings
- code fences
- syntax highlighting
- links
- images
- blockquotes
- lists

### How markdown maps to standards.site
For each published document:
- `content` contains the custom markdown content object
- `textContent` contains plain text extracted from markdown
- `description` comes from frontmatter/excerpt
- `coverImage` maps to hero/cover image when present

### Image handling
For v1:
- new uploads go to the PDS as blobs
- `coverImage` uses the document blob field when relevant
- inline markdown image references resolve via your custom markdown content mapping
- imported `/img/...` references are uploaded and rewritten where feasible

---

## Caching strategy

### Principle
ATProto is canonical storage, but the web app should not hit it fresh for every request.

### Layer A: app cache
Cache:
- publication record
- published post list
- published post by path/slug
- archive/feed data

Implementation:
- in-memory cache for v1

### Layer B: Netlify/CDN cache
Cache rendered public responses:
- homepage
- blog index
- individual posts
- feed
- sitemap

### TTLs
- homepage/blog index: 5 minutes
- individual post pages: 10 minutes
- feed: 5 minutes
- sitemap: 1 hour

### Invalidation
After publish/edit/delete:
- clear post cache
- clear list cache
- clear feed cache
- clear archive cache
- rely on short CDN TTLs for public freshness

Drafts are never publicly cached.

---

## Admin UX plan

### `/admin`
Show:
- drafts
- published posts
- create button
- edit links

### `/admin/new`
Creates a draft with fields:
- title
- slug
- description
- tags
- markdown body
- cover image optional

### `/admin/edit/draft/[rkey]`
Actions:
- save draft
- publish
- delete draft

### `/admin/edit/post/[rkey]`
Actions:
- update published post
- delete post

### Delete behavior
Use hard delete with confirmation in v1.

Deleted published posts return 404.

---

## Importer plan

Source:
- `content/blog/*.md`

### Responsibilities
1. Discover source markdown files
2. Parse frontmatter
3. Derive canonical path
4. Detect image references
5. Upload images as blobs
6. Rewrite markdown references
7. Create published `site.standard.document` records
8. Populate `textContent`
9. Write a manifest
10. Support dry-run and resume modes

### Imported post mapping
Imported historical posts should come in as published documents with:
- `site = publication AT-URI`
- `title = frontmatter title`
- `publishedAt = original frontmatter date`
- `path = preserved canonical blog URL`
- `description = frontmatter description`
- `tags = frontmatter tags`
- `content = custom markdown content object`
- `textContent = plain text extracted from markdown`
- `updatedAt = import time`

### Import script modes
Support:
- `--dry-run`
- `--limit N`
- `--only path`
- `--resume`

---

## Existing images

### Current state
Images currently live under `public/img` and related public paths.

### Target state
New and imported blog images should be stored as PDS blobs.

### v1 policy
For imported posts:
- upload all referenced blog images to the PDS where practical
- set `coverImage` where a clear hero image exists
- rewrite inline markdown references for the rest
- leave unrelated site UI assets local

Importer manifest should flag:
- missing assets
- skipped assets
- rewritten assets
- posts requiring manual cleanup

---

## Feed and SEO plan

### Feed
Generate from published `site.standard.document` records:
- `/feed.xml`

### Sitemap
Generate from publication URL plus document `path` values.

### Canonicals
Each post page emits canonical URL from:
- `publication.url + document.path`

### Metadata
Each post page renders:
- title
- description
- published date
- default OG metadata

### OG
Keep OG simple in v1:
- site-wide default OG image
- per-post `og:title` and `og:description`
- no need to migrate current Eleventy OG pipeline exactly

---

## Migration phases

### Phase 0: confirm custom app lexicons
- define custom draft lexicon
- define custom markdown content lexicon
- confirm OAuth library/client path
- confirm blob serving strategy from the PDS

### Phase 1: scaffold SvelteKit app
- create SvelteKit app
- add Netlify adapter
- set up routes and env/config

### Phase 2: implement standards.site read layer
- fetch publication record
- fetch published documents
- resolve by path/slug
- cache results
- render public blog pages

### Phase 3: implement auth/admin
- Bluesky OAuth login
- DID authorization
- create/edit draft flows
- publish draft -> document flow
- edit/delete published documents
- blob upload

### Phase 4: importer
- build markdown importer
- create publication record if needed
- test on a few posts
- run full import
- inspect manifest

### Phase 5: parity features
- archive
- feed
- sitemap
- verification endpoints/tags
- redirects for slug differences

### Phase 6: cutover
- switch deployment on Netlify
- remove Eleventy build/runtime path
- verify URLs/feed/admin flows

---

## Risks and mitigations

### Risk 1: no standard markdown content schema
Mitigation:
- define one tiny app lexicon for markdown content inside document `content`

### Risk 2: drafts are outside standards.site
Mitigation:
- keep drafts in a custom collection and only publish as `site.standard.document`

### Risk 3: OAuth complexity
Mitigation:
- prototype auth before importer work

### Risk 4: blob URL/rendering details
Mitigation:
- build image upload + rendering flow early

### Risk 5: legacy URL mismatches
Mitigation:
- importer manifest and redirect map

### Risk 6: Netlify runtime tradeoffs
Mitigation:
- keep server-side state simple and rely on CDN TTLs rather than durable cache in v1

---

## Proposed folder structure

```txt
src/
  lib/
    atproto/
      client.ts
      auth.ts
      publication.ts
      documents.ts
      drafts.ts
      blobs.ts
      schema.ts
    server/
      cache.ts
      session.ts
    markdown/
      render.ts
      plaintext.ts
    types/
      blog.ts
  routes/
    +page.svelte
    blog/
      +page.server.ts
      +page.svelte
      [slug]/
        +page.server.ts
        +page.svelte
    archive/
    feed.xml/
    sitemap.xml/
    .well-known/
      site.standard.publication/
        +server.ts
    admin/
      +page.server.ts
      +page.svelte
      new/
      edit/
        draft/[rkey]/
        post/[rkey]/
scripts/
  import-posts.ts
  verify-import.ts
static/
  favicon.ico
```

---

## Cutover checklist

### Standards.site
- publication record exists
- `/.well-known/site.standard.publication` returns the publication AT-URI
- each post page includes `<link rel="site.standard.document">`

### Content
- all old posts imported
- paths verified
- dates correct
- descriptions correct
- tags correct
- `textContent` populated
- images render

### Public site
- homepage works
- blog index works
- old URLs resolve
- feed works
- sitemap works
- metadata renders

### Admin
- login works
- only configured DID can edit
- create draft works
- publish works
- edit works
- delete works
- image upload works

### Caching
- public pages cached
- publish/edit/delete invalidate app cache
- drafts never appear publicly

### Deployment
- env vars configured
- Netlify adapter works
- redirects configured if needed

---

## Recommended implementation order

1. Define custom draft + markdown content lexicons
2. Create publication record shape
3. Scaffold SvelteKit + Netlify adapter
4. Implement publication/document read path
5. Implement markdown rendering + plaintext extraction
6. Prototype OAuth login
7. Implement create/edit draft flow
8. Implement publish draft -> document flow
9. Implement edit/delete published document flow
10. Implement blob upload
11. Build/test importer
12. Add verification endpoints/feed/sitemap/archive
13. Configure redirects
14. Cut over
