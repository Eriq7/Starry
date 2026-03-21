# src/app/api/

Next.js App Router API routes for Starry.

## Routes

### `/api/apod/[date]`
**GET** — Returns APOD metadata for a given date.

- Validates date format and range (>= 1995-06-16, <= today)
- Calls `lib/apod.ts`'s `resolveApod()` which handles NASA fetch + video fallback + DB cache
- Response: `{ date, resolvedDate, title, explanation, copyright }`
- `resolvedDate` may differ from `date` if the requested date was a video

### `/api/apod/image/[date]`
**GET** — Proxies and caches the APOD image for a given date.

- Checks Supabase Storage (`apod/{date}.jpg`) first
- Cache hit: streams the stored image directly
- Cache miss: fetches from NASA, resizes to 1080×1080 with `sharp`, uploads to Storage, streams back
- Always streams through this route (never redirects to Storage URL)
  so Canvas sees same-origin URLs — critical for avoiding canvas taint
- Images are immutable: once uploaded to Storage, never overwritten

### `/api/nodes`
**POST** — Saves a node to the database after the user authenticates.

- Accepts `multipart/form-data` with `draft` (JSON) and `card` (PNG file)
- Authenticates caller via Supabase session cookie
- Inserts row into `nodes` table (service role, bypasses RLS)
- Uploads card PNG to Supabase Storage at `cards/{node_id}.png`
- Stores the storage path (e.g. `{node_id}.png`) in `card_image_url` — not a public URL
- Returns `{ nodeId, cardUrl }` where `cardUrl` is `/api/cards/{nodeId}`
- If Storage upload fails, returns `{ nodeId, cardUrl: null }` (partial success)

### `/api/cards/[nodeId]`
**GET** — Authenticated proxy for private card images.

- Verifies the caller is logged in (session cookie) and owns the requested node
- Downloads `{nodeId}.png` from the private `cards` Storage bucket
- Streams back `image/png` with `Cache-Control: private, max-age=86400`
- 401 if not authenticated or node belongs to another user
- 404 if node not found or no card uploaded yet

### `/api/og`
OG image generation (Phase 2 — not yet implemented).

## Error handling

All routes return structured JSON errors with appropriate status codes.
Image routes return plain text errors with non-200 status codes.

## Caching

- `/api/apod/[date]`: `Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600`
- `/api/apod/image/[date]`: `Cache-Control: public, max-age=31536000, immutable`
