# ATProto Blog Technical Specification

## Purpose

This document turns the migration plan into an implementation-ready spec for a SvelteKit blog backed by ATProto and standards.site records.

It is intentionally v1-scoped:
- single author
- markdown-first editing
- Cloudflare Pages deployment
- simple OG handling
- minimal admin
- no comments

---

## 1. Lexicon-backed model

The live standards.site lexicons currently relevant to this project are:

### `site.standard.publication`
Required:
- `url: string` URI
- `name: string`

Optional:
- `icon: blob`
- `description: string`
- `basicTheme: ref(site.standard.theme.basic)`
- `labels`
- `preferences`

### `site.standard.document`
Required:
- `site: string` URI
- `title: string`
- `publishedAt: string` datetime

Optional:
- `path: string`
- `tags: string[]`
- `links`
- `labels`
- `content` (open union)
- `updatedAt: string`
- `coverImage: blob`
- `bskyPostRef`
- `description: string`
- `textContent: string`
- `contributors`

## Key implications
1. Published posts should be real `site.standard.document` records.
2. Drafts should **not** use `site.standard.document`, because the lexicon has no draft/status model and requires `publishedAt`.
3. Markdown is **not standardized** by standards.site; it must be carried in a custom content schema via the document's open `content` union.
4. The site needs a real `site.standard.publication` record and standards.site verification routes/tags.

---

## 2. System overview

### Source of truth
The ATProto repo is the canonical store for:
- one publication record
- published documents
- draft records
- image blobs

### Application responsibilities
The SvelteKit app is responsible for:
- rendering public pages
- handling admin authentication
- creating/updating/deleting draft and document records
- publishing drafts into standards.site documents
- uploading blobs
- caching public reads
- generating feed and sitemap
- exposing standards.site verification metadata

### Migration responsibilities
A one-time import script migrates Eleventy markdown posts from:
- `content/blog/*.md`

---

## 3. Record collections

## 3.1 Publication collection
Use:
- `site.standard.publication`

Expected count:
- exactly one active publication record for the site

## 3.2 Published post collection
Use:
- `site.standard.document`

Expected count:
- one record per published post

## 3.3 Draft collection
Use a custom app collection, e.g.:
- `dev.disnet.blog.draft`

Expected count:
- any number of drafts

## 3.4 Custom markdown content lexicon
Define a custom lexicon for document content, e.g.:
- `dev.disnet.blog.content.markdown`

This is embedded in `site.standard.document.content`.

Minimal required field:
- `markdown: string`

Optional fields if useful:
- `images`
- `sourceFormat`
- `wordCount`

---

## 4. Route contract

## Public routes

### `/`
Homepage.

Responsibilities:
- render intro/about content
- render recent published documents
- cache publicly

### `/blog`
Blog index.

Responsibilities:
- list published documents in reverse chronological order
- include title, published date, description, tags
- cache publicly

### `/blog/[slug]`
Individual post page.

Responsibilities:
- resolve published document by `path`
- render markdown body from custom content object
- render canonical/meta tags
- emit standards.site `<link rel="site.standard.document">`
- return 404 if document is not found
- cache publicly

### `/archive`
Archive page.

Responsibilities:
- list all published documents grouped or sorted by date
- cache publicly

### `/feed.xml`
Feed endpoint.

Responsibilities:
- generate feed from published documents
- cache publicly

### `/sitemap.xml`
Sitemap endpoint.

Responsibilities:
- include homepage, blog index, archive, and all published document URLs
- cache publicly

### `/.well-known/site.standard.publication`
Verification endpoint.

Responsibilities:
- return the AT-URI of the publication record as plain text
- not require auth

## Admin routes

### `/admin`
Admin dashboard.

Responsibilities:
- require authenticated author DID
- list drafts
- list published documents
- link to create/edit views
- not cache publicly

### `/admin/new`
Create draft page.

Responsibilities:
- require authenticated author DID
- create draft record

### `/admin/edit/draft/[rkey]`
Draft edit page.

Responsibilities:
- require authenticated author DID
- load draft by rkey
- update draft
- publish draft
- delete draft

### `/admin/edit/post/[rkey]`
Published post edit page.

Responsibilities:
- require authenticated author DID
- load document by rkey
- update published document
- delete published document

---

## 5. Local schemas

## 5.1 Publication schema

```ts
type PublicationRecord = {
  $type: 'site.standard.publication'
  url: string
  name: string
  description?: string
  icon?: BlobRef
  basicTheme?: {
    $type: 'site.standard.theme.basic'
    background: unknown
    foreground: unknown
    accent: unknown
    accentForeground: unknown
  }
  preferences?: {
    showInDiscover?: boolean
  }
}
```

## 5.2 Published document schema

```ts
type MarkdownContent = {
  $type: 'dev.disnet.blog.content.markdown'
  markdown: string
}

type PublishedDocument = {
  $type: 'site.standard.document'
  site: string // publication AT-URI preferred
  title: string
  publishedAt: string
  path?: string
  description?: string
  tags?: string[]
  content?: MarkdownContent
  textContent?: string
  updatedAt?: string
  coverImage?: BlobRef
  contributors?: Array<{
    did: string
    role?: string
    displayName?: string
  }>
}
```

## 5.3 Draft schema

```ts
type DraftRecord = {
  $type: 'dev.disnet.blog.draft'
  title: string
  slug: string
  description?: string
  tags?: string[]
  markdown: string
  createdAt: string
  updatedAt: string
  coverImage?: BlobRef
  sourceDocumentRkey?: string
  legacy?: {
    sourcePath?: string
    originalFilename?: string
    importedAt?: string
    previousPaths?: string[]
  }
}
```

## 5.4 BlobRef placeholder
Use the SDK's blob ref type in code. In docs, `BlobRef` means the blob reference object returned by ATProto upload APIs.

---

## 6. Publication setup rules

## 6.1 Publication record
The system must create or reference exactly one publication record.

Recommended values:
- `url = https://<your-domain>`
- `name = disnetdev` or final preferred site name
- `description = short site description`

## 6.2 Verification endpoint
`/.well-known/site.standard.publication` must return:
- `at://did:.../site.standard.publication/<rkey>`

## 6.3 Document verification tag
Every published post page must include:

```html
<link rel="site.standard.document" href="at://did:.../site.standard.document/<rkey>">
```

---

## 7. Canonical URL rules

## 7.1 Publication base URL
Canonical base URL comes from `publication.url`.

## 7.2 Document canonical URL
Canonical post URL is:
- `publication.url + document.path`

## 7.3 Path policy
Use `document.path` for canonical routing.

Examples:
- `/blog/skyreader-rss-on-at-protocol`
- `/blog/never-forgive`

## 7.4 Slug policy
The route slug is the last segment of `document.path`.

Store slug separately only in drafts or helper indexes; published standards.site documents rely on `path`.

---

## 8. Publish flow

## 8.1 Draft creation
Creating a new post creates a `dev.disnet.blog.draft` record.

## 8.2 Draft update
Editing a draft updates the draft record only.

## 8.3 Draft publish
Publishing a draft must:
1. fetch publication AT-URI
2. derive canonical `path`
3. convert markdown to `textContent`
4. create `site.standard.document`
5. optionally record resulting document rkey in the draft
6. optionally delete the draft after successful publish

## Recommendation
Delete the draft after successful publish unless you want a persistent draft history. Simpler v1:
- publish creates document
- publish deletes draft

## 8.4 Published post update
Editing a published post updates the existing `site.standard.document` record in place.

## 8.5 Delete behavior
Deleting a published post hard-deletes the document record.

Deleting a draft hard-deletes the draft record.

---

## 9. Form contract

## 9.1 Draft form fields
- `title`
- `slug`
- `description`
- `tags`
- `markdown`
- `coverImage`

## 9.2 Published edit form fields
- `title`
- `path` or slug-derived path
- `description`
- `tags`
- `markdown`
- `publishedAt`
- `coverImage`

## 9.3 Validation rules

### title
- required
- non-empty after trim

### slug
- required for drafts
- URL-safe
- lowercase normalized in v1

### path
- for published posts, must start with `/`
- canonical format should be `/blog/${slug}` in v1

### description
- optional
- should fit metadata usage

### markdown
- required
- may be empty only if you want blank drafts; otherwise require non-empty

### publishedAt
- required for published documents

## 9.4 Defaulting behavior

### New draft
- `createdAt = now`
- `updatedAt = now`

### Publish draft
- `publishedAt = now` unless manually specified
- `updatedAt = now`

### Edit published post
- preserve `publishedAt`
- set `updatedAt = now`

---

## 10. Public querying rules

## 10.1 Public content source
Public endpoints query only `site.standard.document` records for your repo/publication.

## 10.2 Draft visibility
Drafts are only visible in authenticated admin routes.

## 10.3 Path resolution
The app should resolve a request like `/blog/foo` by matching documents whose `path` equals `/blog/foo`.

## 10.4 Indexing strategy
Recommended app cache indexes:
- document by path
- document by rkey
- publication record
- archive list
- feed list

---

## 11. Authentication and authorization spec

## 11.1 Authentication mechanism
Use ATProto OAuth for login.

## 11.2 Authorization rule
Only the configured DID may access admin pages or write actions.

Config:

```env
AUTHOR_DID=did:plc:...
```

## 11.3 Protected operations
Require authenticated author DID for:
- create draft
- update draft
- publish draft
- update published document
- upload blob
- delete draft
- delete published document
- view admin dashboard

## 11.4 Session handling
- session stored in secure cookie
- cookie is HTTP-only
- secure in production
- same-site appropriate for OAuth callback flow

## 11.5 Failure behavior
- unauthenticated request to admin route -> redirect to sign in
- authenticated non-author DID -> 403
- expired session during write -> redirect to sign in / show recoverable error

---

## 12. Caching and headers

## 12.1 App-level cache
Use an in-memory cache abstraction in `src/lib/server/cache.ts`.

Cache keys:
- `publication:main`
- `documents:index`
- `documents:path:${path}`
- `documents:rkey:${rkey}`
- `archive:index`
- `feed:data`

## 12.2 Cache invalidation events
Invalidate relevant keys after:
- create draft: no public invalidation needed
- update draft: no public invalidation needed
- publish draft
- update published document
- delete published document

Minimum invalidation set after any published write:
- publication if changed
- documents index
- archive index
- feed data
- document by path
- document by rkey

## 12.3 HTTP cache policy

### `/`
`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=300`

### `/blog`
`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=300`

### `/blog/[slug]`
`Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=600`

### `/archive`
`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=300`

### `/feed.xml`
`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=300`

### `/sitemap.xml`
`Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=3600`

### `/.well-known/site.standard.publication`
`Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=3600`

### Admin routes
`Cache-Control: private, no-store`

---

## 13. Markdown rendering spec

## 13.1 Requirements
Markdown renderer must support:
- headings
- paragraphs
- emphasis/strong
- links
- lists
- blockquotes
- fenced code blocks
- inline code
- images

## 13.2 Plaintext extraction
Every published document should populate `textContent` with plaintext derived from markdown.

Rules:
- no markdown syntax
- no HTML tags
- suitable for indexing/search/snippets

## 13.3 Security
Rendered HTML must be sanitized or produced through a safe pipeline.

## 13.4 Content decoding
When reading a published document:
- require `content.$type === 'dev.disnet.blog.content.markdown'`
- read `content.markdown`
- render to HTML

If content type is unknown:
- fail closed in admin
- return graceful unsupported-content behavior publicly

---

## 14. Blob upload spec

## 14.1 Supported use cases
- upload cover image
- upload inline blog images referenced in markdown
- upload images during importer migration

## 14.2 Admin upload flow
1. author selects file
2. browser submits file to server action/endpoint
3. server validates MIME type and size
4. server uploads blob to PDS
5. server stores returned blob ref
6. for cover image, save on draft/document record
7. for inline image, insert generated markdown reference

## 14.3 Validation
At minimum validate:
- image MIME type
- non-zero size
- maximum upload size appropriate for blog images

Note: `site.standard.document.coverImage` allows `image/*` and max size 1,000,000 bytes.

## 14.4 Persisted data
Persist:
- blob ref
- MIME type
- optional alt text
- optional size metadata

---

## 15. Importer spec

## 15.1 Input
Importer reads all markdown posts from:
- `content/blog/*.md`

## 15.2 Parsed fields
For each file parse:
- `title`
- `date`
- `description`
- `tags`
- markdown body

## 15.3 Path derivation
Importer should:
- derive a canonical path from existing site behavior where possible
- preserve legacy URL compatibility
- emit redirect notes in manifest if normalization differs

## 15.4 Document mapping
For each imported post create a `site.standard.document` with:
- `site = publication AT-URI`
- `title = frontmatter title`
- `publishedAt = original frontmatter date`
- `path = canonical preserved path`
- `description = frontmatter description`
- `tags = frontmatter tags`
- `content = { $type: 'dev.disnet.blog.content.markdown', markdown }`
- `textContent = plaintext(markdown)`
- `updatedAt = import time`
- `coverImage` if inferable and uploaded

## 15.5 Image migration
Importer must:
- detect markdown image references
- resolve local paths
- upload referenced files as blobs
- rewrite markdown to blob-backed references where possible
- record missing or skipped images in manifest

## 15.6 Manifest output
Write a JSON manifest containing at least:

```json
{
  "source": "content/blog/example.md",
  "title": "Example",
  "finalPath": "/blog/example",
  "atUri": "at://did:.../site.standard.document/rkey",
  "cid": "...",
  "uploadedBlobs": [],
  "missingAssets": [],
  "warnings": []
}
```

## 15.7 CLI modes
Support:
- `--dry-run`
- `--limit <n>`
- `--only <path>`
- `--resume`

## 15.8 Failure policy
- continue on per-post failure where possible
- write failures to manifest/report
- do not abort whole import unless auth/config is invalid

---

## 16. Public page data contracts

## 16.1 Document summary shape
Used for index/archive/feed.

```ts
type DocumentSummary = {
  rkey: string
  path: string
  slug: string
  title: string
  description?: string
  tags?: string[]
  publishedAt: string
}
```

## 16.2 Post page shape
Used for `/blog/[slug]`.

```ts
type PostPageData = {
  uri: string
  rkey: string
  path: string
  slug: string
  title: string
  description?: string
  tags?: string[]
  updatedAt?: string
  publishedAt: string
  html: string
  coverImageUrl?: string
}
```

---

## 17. Feed and sitemap generation

## 17.1 Feed inclusion rules
Include only published `site.standard.document` records.

Each item should include:
- title
- canonical URL
- description if available
- publication date
- rendered content or summary

## 17.2 Sitemap inclusion rules
Include:
- `/`
- `/blog`
- `/archive`
- each published document path

Exclude:
- drafts
- admin routes

---

## 18. SEO and metadata rules

## 18.1 Per-post metadata
Each post page should emit:
- `<title>`
- meta description
- canonical URL
- `og:title`
- `og:description`
- default OG image
- `link rel="site.standard.document"`

## 18.2 Site defaults
Fallback values should exist for:
- title template
- description
- OG image

---

## 19. Environment/config checklist

Expected env vars:

```env
AUTHOR_DID=did:plc:...
PUBLIC_SITE_URL=https://example.com
SESSION_SECRET=...
PUBLICATION_RKEY=... # optional if record is created out of band
```

Additional ATProto OAuth config will be required depending on library choice.

---

## 20. Proposed file structure

```txt
src/
  lib/
    atproto/
      auth.ts
      blobs.ts
      client.ts
      documents.ts
      drafts.ts
      publication.ts
      schema.ts
    markdown/
      render.ts
      plaintext.ts
    server/
      cache.ts
      session.ts
    types/
      blog.ts
  routes/
    +page.server.ts
    +page.svelte
    .well-known/
      site.standard.publication/
        +server.ts
    archive/
      +page.server.ts
      +page.svelte
    blog/
      +page.server.ts
      +page.svelte
      [slug]/
        +page.server.ts
        +page.svelte
    feed.xml/
      +server.ts
    sitemap.xml/
      +server.ts
    admin/
      +page.server.ts
      +page.svelte
      new/
        +page.server.ts
        +page.svelte
      edit/
        draft/[rkey]/
          +page.server.ts
          +page.svelte
        post/[rkey]/
          +page.server.ts
          +page.svelte
scripts/
  import-posts.ts
  verify-import.ts
```

---

## 21. Implementation order

1. Define local TS/Zod schemas for `site.standard.publication` and `site.standard.document`
2. Define custom lexicons for `dev.disnet.blog.draft` and `dev.disnet.blog.content.markdown`
3. Scaffold SvelteKit app with Cloudflare adapter for Cloudflare Pages
4. Implement publication/document read path and verification endpoint/tag
5. Add markdown rendering and plaintext extraction
6. Add OAuth authentication and DID authorization
7. Build draft create/edit/publish/delete actions
8. Build published document edit/delete actions
9. Add blob upload handling
10. Build importer and test on a small subset
11. Run full import and verify manifest
12. Add feed/sitemap/redirect handling
13. Cut over deployment

---

## 22. Remaining open implementation items

1. exact NSID names for the custom draft and markdown-content lexicons
2. exact blob-backed URL format for inline markdown images
3. whether published-post edits happen directly on documents or via temporary draft copies
4. whether the importer can infer cover images automatically or only migrate inline assets
