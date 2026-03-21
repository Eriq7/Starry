# src/lib/

Shared utilities and service clients. Split by runtime context (browser vs. server).

## Files

| File | Runtime | Purpose |
|------|---------|---------|
| `supabase-browser.ts` | Browser | `getSupabaseBrowser()` — cookie-based Supabase client via `@supabase/ssr`. Session shared with server components. Safe to use in client components. |
| `supabase-server.ts` | Server only | Two exports: `createServerComponentClient()` (cookie-based, for auth checks) and `createServiceClient()` (service role, bypasses RLS for Storage uploads). **Never import in client components.** |
| `apod.ts` | Server | APOD resolution logic: NASA API fetch, video fallback walk, Supabase DB caching. |
| `keywords.ts` | Universal | Maps APOD title/explanation to keyword suggestions via `src/data/keyword-map.json`. |
| `canvas.ts` | Browser | Canvas-based share card generation. Uses same-origin `/api/apod/image/` URLs to avoid taint. |
| `draft.ts` | Browser | localStorage draft management for the anonymous → Magic Link → return flow. |
| `analytics.ts` | Browser | `trackEvent()` utility. Inserts into Supabase `events` table. Non-blocking — never throws. |
| `nodes.ts` | Browser | `saveNode(draft, cardBlob)` — client-side fetch wrapper that POSTs to `/api/nodes` to save a node after auth. |

## Key design decisions

### Two Supabase clients

- `supabase-browser.ts`: uses `@supabase/ssr`'s `createBrowserClient` — stores session in cookies (not localStorage) so server components see the same session. RLS applies.
- `supabase-server.ts`: exports two clients:
  - `createServerComponentClient()` — reads cookies via `next/headers`, used for auth checks and user-scoped queries in server components and route handlers
  - `createServiceClient()` — uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS for Storage uploads (apod cache, card uploads)

### APOD resolution (apod.ts)

`resolveApod(date)` is the single entry point for all APOD data:
1. Check `apod_cache` table
2. Fetch NASA APOD API if not cached
3. Walk ±1 day (prefer earlier) if `media_type === 'video'`
4. Cache result (immutable — never overwrite existing entries)
5. Return `ApodMetadata` with both `date` (requested) and `resolvedDate` (actual)

### Draft (draft.ts)

Drafts auto-expire after 24 hours. The draft is written on every note/keyword change
in the explore page, so it's always current when auth redirect returns.

### Canvas (canvas.ts)

Card is 1080×1080 px. Photo covers the full square (center crop).
Text is overlaid on top/bottom gradient panels.
`crossOrigin = 'anonymous'` is set on the image element — the server must return
`Access-Control-Allow-Origin: *` headers (Next.js API routes do this by default).
