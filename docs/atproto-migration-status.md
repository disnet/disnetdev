# ATProto Migration Status

Last updated: 2026-04-21

## Current status

We have completed the initial migration foundation for the blog and now have working authenticated ATProto draft CRUD in the admin.

The project is now in a good state to begin implementing the publish flow from draft -> `site.standard.document`.

---

## Completed so far

### 1. SvelteKit migration scaffold
- SvelteKit app added at repo root
- Netlify adapter configured
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

---

## Verified working

### Build/tooling
- `npm run check` passes
- `npm run build` passes

### Draft CRUD
- ATProto draft listing works in admin
- `/admin/new` creates real `dev.disnet.blog.draft` records
- `/admin/edit/draft/[rkey]` loads existing drafts
- draft save updates the record in place
- draft delete removes the record
- minimal title/slug validation is in place

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

## Priority 1: Publish draft -> `site.standard.document`
Draft CRUD is now in place, so publishing is the next major milestone.

Flow:
1. load draft
2. derive canonical path, probably `/blog/${slug}`
3. convert markdown to `textContent`
4. create `site.standard.document`
5. optionally delete draft after successful publish
6. invalidate relevant caches

Need to populate:
- `site`
- `title`
- `publishedAt`
- `path`
- `description`
- `tags`
- `content = { $type: 'dev.disnet.blog.content.markdown', markdown }`
- `textContent`
- `updatedAt`

---

## Priority 2: Edit/delete published posts
Implement `/admin/edit/post/[rkey]` properly.

Actions:
- load published document
- edit title/path/description/tags/markdown/publishedAt
- update existing record in place
- hard delete post
- invalidate public caches

---

## Priority 3: Durable auth/session storage
This is the biggest remaining infrastructure caveat.

Current auth storage is in-memory:
- OAuth state store
- OAuth session store
- web session store

That is fine for local development but not production-safe on Netlify/serverless.

We need durable storage for production, such as:
- Redis / Upstash
- database-backed session/state store
- another Netlify-compatible persistent store

### Important
Do this before depending on admin auth in production.

---

## Priority 4: Blob upload support
Need to add image upload flow for:
- cover images
- later inline markdown images

Likely pieces:
- server-side upload endpoint or action
- MIME/size validation
- ATProto blob upload
- storage of blob refs on drafts/documents

---

## Priority 5: Importer
After draft/publish flow is stable, build the one-time importer.

Planned script:
- `scripts/import-posts.ts`

Responsibilities:
- read `content/blog/*.md`
- parse frontmatter
- derive canonical paths
- detect and migrate image refs
- create `site.standard.document` records
- write manifest
- support dry-run/resume

---

## Priority 6: Public parity and polish
After core content authoring is stable:
- archive polish
- feed polish
- sitemap polish
- post metadata/canonical cleanup
- standards.site tags/verification check
- redirects for legacy slugs

---

## Known caveats right now

### 1. Auth/session persistence is not production-ready
All auth/session state is in-memory.

### 2. `/client-metadata.json` is not used in local OAuth mode
For local dev we now rely on localhost-development client-id behavior, not fetched metadata.
That is expected.

### 3. Public content depends on real ATProto records existing
If there are no matching `site.standard.document` records for the configured publication, public pages render but are empty.

### 4. No ATProto write layer yet for published posts
Draft writes now exist, but published post create/update/delete still need to be implemented.

---

## Recommended immediate next implementation

Build **publish draft -> `site.standard.document`** next.

Concrete tasks:
1. add publish action on `/admin/edit/draft/[rkey]`
2. derive canonical path from slug
3. render markdown plaintext for `textContent`
4. create `site.standard.document`
5. decide whether to keep or delete the draft after publish
6. invalidate document caches after publish

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
- [ ] publish draft
- [ ] published draft appears on `/blog`
- [ ] published post page loads at `/blog/[slug]`

---

## Bottom line

We are past scaffolding and bootstrap/auth setup.

The next real feature milestone is:
**publish draft -> standards.site document**, followed by **editing and deleting published posts**.
