# src/app/gift/

Gift flow — lets users send a personalised star moment to a friend.

## Routes

### `/gift/create` (client component)
Gift creation form: friend's name, a date, optional message.
Auth-gated — prompts sign-in via AuthModal if not logged in.
On submit → `POST /api/gifts` → shows copyable gift URL.

### `/gift/[id]` (server component + client reveal)
Public gift landing page, server-rendered for SEO/OG.

- `page.tsx`: fetches gift from DB, generates OG metadata, renders `<GiftReveal>`
- `GiftReveal.tsx`: blur-to-reveal interaction; tracks `gift_viewed` / `gift_converted`
- `not-found.tsx`: custom 404 shown when gift ID doesn't exist

## OG meta
Gift pages generate dynamic OG images via `/api/og?date=...&name=...` so the blurred
APOD photo and recipient name appear correctly on Twitter, WhatsApp, iMessage, etc.

## DB table: `gifts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | 8-char UUID prefix |
| `sender_id` | uuid FK | auth.users |
| `recipient_name` | text | |
| `event_date` | date | user-entered |
| `resolved_apod_date` | date | from resolveApod() |
| `apod_title` | text | |
| `apod_copyright` | text | nullable |
| `message` | text | nullable |
| `viewed_at` | timestamptz | set on first view |
| `created_at` | timestamptz | auto |

RLS: INSERT/SELECT by `auth.uid() = sender_id`; public SELECT for viewing gifts.
