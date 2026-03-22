# Starry — Project Plan

## Sprint 1-3: MVP ✅
Core explore flow, card generation, auth (Magic Link), save/profile page. Complete as of initial commit.

---

## Sprint 4: Timeline (Time River) ✅

Upgrade the "My Stars" page (`/profile`) into a full-screen vertical scroll timeline.

| Step | Description | Status |
|------|-------------|--------|
| 4.1 | Rename "My Stars" → "My Starry" across nav | ✅ |
| 4.2 | Create `TimelineCard.tsx` — full-viewport APOD card | ✅ |
| 4.3 | Create `TimelineView.tsx` — scroll-snap container + share integration | ✅ |
| 4.4 | Upgrade `profile/page.tsx` to use TimelineView | ✅ |
| 4.5 | Add floating "+" button / CTA to `/explore` in timeline | ✅ |

---

## Sprint 5: Gift & Curated Gallery ✅

### Part A: Gift Flow
| Step | Description | Status |
|------|-------------|--------|
| 5.1 | `api/gifts/route.ts` — gift creation API | ✅ |
| 5.2 | `gift/create/page.tsx` — gift creation UI | ✅ |
| 5.3 | `gift/[id]/page.tsx` + `GiftReveal.tsx` — gift landing (SSR + blur reveal) | ✅ |
| 5.4 | `api/og/route.ts` — OG image generation | ✅ |
| 5.5 | Gift links in nav (homepage + timeline) | ✅ |

### Part B: Curated Gallery
| Step | Description | Status |
|------|-------------|--------|
| 5.6 | Expand `curated-photos.json` (3 → 40 entries, real APOD dates) | ✅ |
| 5.7 | `CuratedGallery.tsx` — responsive photo picker | ✅ |
| 5.8 | `DateInput.tsx` + `explore/page.tsx` — pre-1995 → curated flow | ✅ |

---

## Sprint 6: Visual Polish & Launch ✅

| Step | Description | Status |
|------|-------------|--------|
| 6.1 | `canvas.ts` — `disposeCanvas()` + `ShareCard.tsx` cleanup on unmount | ✅ |
| 6.2 | `TimelineCard.tsx` — lazy loading + IntersectionObserver | ✅ |
| 6.3 | Homepage performance: `fetchpriority`, `preconnect`, dynamic ShareModal | ✅ |
| 6.4 | `globals.css` — design tokens, animations, polish | ✅ |
| 6.5 | `error.tsx`, `not-found.tsx`, `gift/[id]/not-found.tsx` | ✅ |

---

## Sprint 8: Bug Fixes (Post-Testing) ✅

| Step | Description | Status |
|------|-------------|--------|
| A | Homepage APOD background — env issue (no code change); check NASA_API_KEY + Supabase vars in `.env.local` | ✅ (manual) |
| B | `canvas.ts` — add `getCinzelFont()` helper; replace all 5 system-font strings with Cinzel Decorative; bump date size 20→24px | ✅ |
| C | `ShareModal.tsx` — replace Caption button with "Add to My Starry" (`onSaveToTimeline` prop + `timelineSaveState`); update `buildCaption` branding; `explore/page.tsx` — add `handleSaveToTimeline` callback | ✅ |
| D | SQL migration clarification — run only the two `ALTER TABLE` lines in Supabase Dashboard (no code change) | ✅ (manual) |

---

## Sprint 9: Bug Fix — Timezone (Homepage APOD) ✅

| Step | Description | Status |
|------|-------------|--------|
| 9.1 | `lib/apod.ts` — add `getEasternToday()` using `en-CA` locale + `America/New_York` timezone | ✅ |
| 9.2 | `app/page.tsx` — replace UTC date with `getEasternToday()`; display date uses Eastern timezone | ✅ |
| 9.3 | `api/apod/[date]/route.ts` — future-date guard uses `getEasternToday()` instead of UTC | ✅ |

---

## Sprint 7: Bug Fixes & UX Polish ✅

| Step | Description | Status |
|------|-------------|--------|
| 7.1 | DB migration: `ALTER TABLE gifts ADD COLUMN apod_title text; ADD COLUMN apod_copyright text;` (manual, run in Supabase Dashboard) | ✅ (code was correct; DB needs manual migration) |
| 7.2 | Add Cinzel Decorative font via `next/font/google` in `layout.tsx` | ✅ |
| 7.3 | `globals.css` — `.font-cinzel` utility + `bounce-down` / `fade-out` animations | ✅ |
| 7.4 | Apply Cinzel to headings: homepage, explore, gift create, GiftReveal, error, not-found, TimelineView | ✅ |
| 7.5 | Rename "Gift a Star" → "Gift a Starry" in `gift/create/page.tsx` | ✅ |
| 7.6 | `explore/page.tsx` — post-save CTA "View in My Starry →" linking to `/profile` | ✅ |
| 7.7 | `TimelineView.tsx` — tagline overlay on first card (auto-fades after 3.5s or on scroll) | ✅ |
| 7.8 | `TimelineView.tsx` — animated scroll hint (chevron + "Scroll" label) on first card when nodes > 1 | ✅ |
| 7.9 | `canvas.ts` — branding changed from `✦ starry.app` → `✦ Starry` | ✅ |
