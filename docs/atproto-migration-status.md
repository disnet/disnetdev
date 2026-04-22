# ATProto Migration Status

Last updated: 2026-04-22

## Current status

We have completed the initial migration foundation for the blog, have working authenticated ATProto draft CRUD in the admin, working published post editing/deletion, the initial draft -> `site.standard.document` publish flow, working blob upload support for cover images and inline markdown images, and a working one-shot importer for the Eleventy-era archive.

The next remaining milestone is a short production-readiness pass for auth env wiring, followed by public-parity polish.

---

## Completed so far

### 1. SvelteKit migration scaffold
- SvelteKit app added at repo root
- Cloudflare adapter configured for Cloudflare Pages
- Vite/TypeScript/Svelte config added
- Eleventy commands preserved as `legacy:*` scripts

Key files:
- `package.json`
- `svelte.config.js`
- `vite.config.ts`
- `tsconfig.json`
- `src/app.html`

### 2. Initial site routes
Implemented route shells for:
- `/`
- `/blog`
- `/blog/[slug]`
- `/archive`
- `/feed.xml`
- `/sitemap.xml`
- `/admin`
- `/.well-known/site.standard.publication`

### 3. Standards.site and local schemas
Added local types and Zod schemas for:
- `site.standard.publication`
- `site.standard.document`
- `dev.disnet.blog.draft`
- `dev.disnet.blog.content.markdown`

Key files:
- `src/lib/types/blog.ts`
- `src/lib/atproto/schema.ts`

### 4. Markdown and cache utilities
Added:
- markdown rendering helper
- plaintext extraction helper
- in-memory cache helper

Key files:
- `src/lib/markdown/render.ts`
- `src/lib/markdown/plaintext.ts`
- `src/lib/server/cache.ts`

### 5. Public ATProto read layer
Implemented:
- publication fetch by AT URI
- published document listing
- published document lookup by slug/path
- feed generation from live documents
- sitemap generation from live documents

Key files:
- `src/lib/atproto/client.ts`
- `src/lib/atproto/publication.ts`
- `src/lib/atproto/documents.ts`
- `src/lib/feeds/rss.ts`
- `src/lib/feeds/sitemap.ts`

### 6. DID-based PDS resolution
Removed dependency on a manually configured XRPC base URL.

The app now:
- parses repo DID from the publication AT URI
- resolves the DID document
- finds the `AtprotoPersonalDataServer` endpoint
- talks directly to the correct PDS

Key files:
- `src/lib/atproto/did.ts`
- `src/lib/atproto/service.ts`

### 7. OAuth/admin scaffold
Implemented:
- ATProto OAuth client setup
- login page
- callback handler
- logout handler
- cookie-backed web session shell
- protected admin routes

Key files:
- `src/lib/atproto/auth.ts`
- `src/lib/server/session.ts`
- `src/hooks.server.ts`
- `src/routes/auth/login/+page.server.ts`
- `src/routes/auth/login/+page.svelte`
- `src/routes/auth/callback/+server.ts`
- `src/routes/auth/logout/+server.ts`
- `src/routes/admin/+page.server.ts`

### 8. Local OAuth dev mode fixed
Local login now works using the ATProto localhost development client-id exception.

Important detail:
- local app can run at `http://127.0.0.1:5173`
- OAuth client_id is synthesized as `http://localhost?...`
- callback still points to local app

This matches the working pattern used in `semble`.

### 9. Publication bootstrap script
Added a one-time bootstrap script that:
- prompts for Bluesky handle
- prompts for app password
- resolves the author DID to its PDS
- logs in using app-password auth
- checks existing `site.standard.publication` records
- prevents duplicates for the same `PUBLIC_SITE_URL`
- creates a new publication when needed

Key file:
- `scripts/bootstrap-publication.mjs`

Command:

```bash
npm run bootstrap:publication
```

### 10. Draft CRUD
Implemented real ATProto-backed draft management for collection:
- `dev.disnet.blog.draft`

Implemented:
- draft listing in admin
- create draft form on `/admin/new`
- load/edit draft on `/admin/edit/draft/[rkey]`
- save draft
- delete draft
- minimal title/slug validation
- draft cache invalidation after writes

Key files:
- `src/lib/atproto/drafts.ts`
- `src/lib/server/draft-form.ts`
- `src/routes/admin/+page.svelte`
- `src/routes/admin/new/+page.server.ts`
- `src/routes/admin/new/+page.svelte`
- `src/routes/admin/edit/draft/[rkey]/+page.server.ts`
- `src/routes/admin/edit/draft/[rkey]/+page.svelte`

### 11. Blob upload support
Implemented cover image and inline markdown image uploads backed by `com.atproto.repo.uploadBlob`.

Implemented:
- author-only upload endpoint at `/api/upload-blob` (MIME + size validation, up to 4MB, jpg/png/webp/gif)
- shared `CoverImageField` component with upload-on-select, live preview, replace, and remove
- shared `InsertImageButton` component that uploads a file and inserts `![alt](blob:CID)` at the textarea cursor
- `embeddedBlobs` tracked on both `dev.disnet.blog.draft` and `site.standard.document` so referenced blobs aren't GC'd by the PDS (filtered at save time against the current markdown so orphans don't accumulate)
- `coverImage` and `embeddedBlobs` carried from draft to published document on publish
- public post page renders the cover image and rewrites inline `blob:CID` refs to full `com.atproto.sync.getBlob` URLs at render time

Key files:
- `src/routes/api/upload-blob/+server.ts`
- `src/lib/atproto/blobs.ts`
- `src/lib/admin/upload.ts`
- `src/lib/components/CoverImageField.svelte`
- `src/lib/components/InsertImageButton.svelte`
- `src/lib/atproto/schema.ts`
- `src/lib/types/blog.ts`
- `src/lib/server/draft-form.ts`
- `src/lib/server/post-form.ts`
- `src/lib/atproto/documents.ts`
- `src/routes/blog/[slug]/+page.svelte`
- `src/routes/admin/studio.css`
- `src/routes/cathode.css`

### 12. Legacy content importer
Implemented a one-shot importer for the Eleventy-era archive.

Behavior:
- reads `content/blog/*.md`, parses frontmatter via `gray-matter`
- replicates Eleventy's permalink (`/blog/{YYYY-MM-DD}-{slugify(title)}`) using `@sindresorhus/slugify` with `{ decamelize: false }` so existing URLs are preserved
- logs in via app-password (same pattern as `bootstrap-publication.mjs`)
- uploads inline `/img/*` references to the PDS via `com.atproto.repo.uploadBlob`, rewrites them to `blob:CID`, and records `embeddedBlobs`
- writes directly to `site.standard.document` (no intermediate draft)
- persists state to `scripts/import-manifest.json` (gitignored) so resume skips already-imported posts and deduplicates repeated images by source path
- supports `--dry-run` and `--limit N`

Key files:
- `scripts/import-posts.mjs`
- `package.json` (adds `import:posts` script and `@sindresorhus/slugify` devDependency)
- `.gitignore` (ignores `scripts/import-manifest.json`)

Command:

```bash
npm run import:posts -- --dry-run          # preview everything
npm run import:posts -- --limit 5          # import next 5
npm run import:posts                       # import all remaining
```

Slug verification: all 50 source posts produce paths that match the live `_site/blog/` output exactly, so existing links keep working once imports go live.

---

## Verified working

### Build/tooling
- `npm run check` passes
- `npm run build` passes

### Draft CRUD
- ATProto draft listing works in admin
- `/admin/new` creates real draft records
- `/admin/edit/draft/[rkey]` loads existing drafts
- draft save updates the record in place
- draft delete removes the record
- minimal title/slug validation is in place

### Publish flow
- draft edit page can publish to `site.standard.document`
- canonical path is derived as `/blog/${slug}`
- markdown plaintext is stored in `textContent`
- document caches are invalidated after publish
- duplicate publish is blocked if the draft was already published
- duplicate path publish is blocked if `/blog/${slug}` already exists
- draft is retained after publish and stores `sourceDocumentRkey`

### Published post editing/deletion
- `/admin/edit/post/[rkey]` loads real `site.standard.document` records
- published posts can be edited in place
- path collisions are blocked when changing a post path
- published posts can be hard deleted
- linked drafts are unlinked on delete by clearing `sourceDocumentRkey`

### Blob uploads
- `/api/upload-blob` accepts multipart uploads from the admin and calls `com.atproto.repo.uploadBlob` as the author
- cover images can be attached, replaced, or removed on drafts and published posts, with live preview
- inline markdown images can be inserted from the editor toolbar; markdown stores `blob:CID` refs which render through `com.atproto.sync.getBlob` on the public page
- `embeddedBlobs` is filtered to only blobs still referenced in the current markdown before each save

### Bootstrap
- publication bootstrap works
- duplicate prevention now checks by publication `url`
- existing publications for other URLs no longer block creating a new publication

### Local OAuth
- login works locally after switching to localhost-development client-id mode

### Admin shell
- `/admin` is protected
- login redirects correctly
- logout works

---

## What still needs to be built next

## Priority 1: Edit/delete published posts
Completed.

Implemented `/admin/edit/post/[rkey]` with:
- published document loading
- editing title/path/description/tags/markdown/publishedAt
- in-place `site.standard.document` updates
- hard delete for published posts
- public document cache invalidation after updates/deletes
- linked draft discovery in the admin UI
- draft unlinking on published post delete so a retained draft can be republished later

## Priority 3: Blob upload support
Completed.

Implemented cover image + inline markdown image uploads with:
- `/api/upload-blob` endpoint (author-only, MIME + size validation)
- shared `CoverImageField` and `InsertImageButton` components
- `coverImage` + `embeddedBlobs` fields on draft and document records
- inline `blob:CID` refs in markdown, rewritten to `com.atproto.sync.getBlob` URLs at render time
- `embeddedBlobs` filtered against the current markdown on save to prune orphans
- cover image + embedded blobs carried from draft to document on publish

Known follow-ups:
- OAuth scope updated to include `rpc:com.atproto.repo.uploadBlob` and `blob:*/*`. Existing OAuth sessions should be signed out and re-authorized so they pick up the new scope grant. In production this is a one-time forced re-login; in dev, just `logout` + `login` again.
- No image size/format transformation — uploads are stored as-is. A later pass could resize/webp the cover image before upload.

---

## Priority 2: Durable auth/session storage
Partially completed.

Implemented:
- durable key/value backing for OAuth state/session storage via a Cloudflare KV binding (`KV`)
- signed cookie web session so the lightweight browser session no longer depends on an in-memory server map
- local in-memory fallback when the KV binding is not present (dev/local)
- request-scoped access to `event.platform.env` via AsyncLocalStorage so module-level OAuth client stores can reach the binding

Current caveat:
- production needs a Cloudflare KV namespace bound as `KV` on the Pages project to avoid falling back to in-memory OAuth storage
- `SESSION_COOKIE_SECRET` should be set in production for signed cookie integrity
- KV is eventually consistent across POPs (propagation up to ~60s); realistic worst case is an occasional forced re-login if a token-refresh write hasn't propagated to the POP serving the next request

### Important
Before relying on admin auth in production:
1. create a KV namespace in Cloudflare
2. bind it as `KV` on the Pages project (Settings → Functions → KV namespace bindings)
3. set `SESSION_COOKIE_SECRET`
4. ensure the Pages project uses a compatibility date / flags that include `nodejs_compat` so `node:async_hooks` (`AsyncLocalStorage`) is available

---

## Priority 4: Importer
Completed.

Implemented `scripts/import-posts.mjs` with:
- frontmatter parsing via `gray-matter`
- canonical path derived from `frontmatter.date` + `@sindresorhus/slugify(title, { decamelize: false })` to match Eleventy's output
- `/img/*` references uploaded via `com.atproto.repo.uploadBlob`, rewritten to `blob:CID`, collected into `embeddedBlobs`
- direct `site.standard.document` creates (no draft round-trip)
- manifest-backed resume at `scripts/import-manifest.json` (gitignored) with per-image CID caching
- `--dry-run` and `--limit N` flags

Known follow-ups:
- legacy `aliases:` frontmatter entries (20 posts) are currently dropped; redirects for those will be handled in priority 5
- `posted: false` and `type: blog draft` frontmatter are not treated as skip signals — Eleventy built these anyway, so the importer follows suit

---

## Priority 5: Public parity and polish
After core content authoring is stable:
- archive polish
- feed polish
- sitemap polish
- post metadata/canonical cleanup
- standards.site tags/verification check
- redirects for legacy slugs

---

## Future: upgrade OAuth to a confidential client
Currently the OAuth client is public (`token_endpoint_auth_method: 'none'`) with DPoP-bound access tokens. Acceptable for a single-author admin today, but worth upgrading later for stronger token-exchange protections and broader scope compatibility on PDSes that gate features on confidential clients.

Pieces required:
- generate a signing key (ES256 recommended), store private JWK as a secret (e.g. `OAUTH_PRIVATE_JWK`)
- add a `/jwks.json` route that serves the public JWK set
- update client metadata to set `token_endpoint_auth_method: 'private_key_jwt'` and `jwks_uri: ${siteUrl}/jwks.json`
- pass a `keyset` into `NodeOAuthClient({ keyset, clientMetadata, ... })` built from the private JWK
- keep DPoP on
- rotate existing sessions on cutover (old public-client sessions stored in KV will not authenticate under the new method)

Key files to touch:
- `src/lib/atproto/auth.ts`
- `src/routes/client-metadata.json/+server.ts`
- new `src/routes/jwks.json/+server.ts`

---

## Known caveats right now

### 1. OAuth durability still depends on the KV binding
OAuth state/session storage uses a Cloudflare KV binding named `KV`; if the binding is missing from `event.platform.env` the app falls back to in-memory storage.

### 2. `/client-metadata.json` is not used in local OAuth mode
For local dev we now rely on localhost-development client-id behavior, not fetched metadata.
That is expected.

### 3. Public content depends on real ATProto records existing
If there are no matching `site.standard.document` records for the configured publication, public pages render but are empty.

### 4. Production auth still needs env wiring
Published post writes exist, signed cookie web sessions exist, and OAuth state/session storage uses a Cloudflare KV binding, but production still needs the KV namespace bound as `KV`, `SESSION_COOKIE_SECRET` set, and `nodejs_compat` enabled.

---

## Recommended immediate next implementation

Finish **production auth env wiring and validation** next.

Concrete tasks:
1. create a Cloudflare KV namespace and bind it as `KV` on the Pages project
2. configure `SESSION_COOKIE_SECRET` in Cloudflare Pages
3. ensure `nodejs_compat` is enabled for the Pages project (compatibility flags)
4. verify login/logout/admin access across cold starts and deploys
5. document local-vs-production auth storage behavior
6. confirm OAuth session restore works after deploy/server restart

---

## Suggested test checklist before and during next phase

### Already worth keeping as regression checks
- [ ] `npm run check`
- [ ] `npm run build`
- [ ] `npm run bootstrap:publication`
- [ ] `/.well-known/site.standard.publication` returns the correct AT URI
- [ ] `/admin` redirects when signed out
- [ ] local OAuth login succeeds
- [ ] `/admin` renders after login
- [ ] logout works

### Next phase test targets
- [x] create draft
- [x] edit draft
- [x] delete draft
- [x] publish draft
- [x] published draft appears on `/blog`
- [x] published post page loads at `/blog/[slug]`
- [x] edit published post
- [x] delete published post
- [ ] attach a cover image to a new draft (upload succeeds, preview renders)
- [ ] replace + remove cover image on an existing draft
- [ ] insert an inline image from the editor toolbar
- [ ] publish a draft with cover + inline images and verify both render on `/blog/[slug]`
- [ ] edit a published post's cover image in place

---

## Bottom line

We are past scaffolding, bootstrap/auth setup, blob upload support, and the legacy content importer.

What remains is a short production-readiness pass for auth env wiring, then public-parity polish (archive, feed, sitemap, redirects for legacy aliases).
