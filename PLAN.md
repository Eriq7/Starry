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

## Sprint 10: Personalized Card — Name + Meteor Decorations ✅

| Step | Description | Status |
|------|-------------|--------|
| 10.1 | `lib/draft.ts` — add `displayName` field to Draft interface | ✅ |
| 10.2 | `lib/canvas.ts` — add `displayName?` to CardOptions; dynamic top bar (120→160px when name present, photo shrinks 1080→1040px); "To [name]" in italic Cinzel top-left | ✅ |
| 10.3 | `lib/canvas.ts` — `drawMeteorDecorations()`: deterministic meteors + micro-stars on left/right safe zones of both bars; drawn before all text | ✅ |
| 10.4 | `explore/page.tsx` — `displayName` state; input field above keyword picker (max 15 chars); wired into draft persistence and cardOptions | ✅ |

---

## Sprint 11: Card Polish — Bigger "To Name" + Unified Meteor Direction ✅

| Step | Description | Status |
|------|-------------|--------|
| 11.1 | `lib/canvas.ts` — "To [name]" font 20→28px, opacity 0.55→0.70 | ✅ |
| 11.2 | `lib/canvas.ts` — `noteY` when name present: 44→52 | ✅ |
| 11.3 | `lib/canvas.ts` — Full rewrite of `drawMeteorDecorations()`: all 8 meteors now travel upper-right → lower-left; head opacity 0.55, dot 0.70, line width 2px default; longer 40–90px streaks; star opacity boosted to 0.12–0.15 | ✅ |

---

## Sprint 12: Card Visual Fix — Font Size, Date Move, Full Meteor Shower ✅

| Step | Description | Status |
|------|-------------|--------|
| 12.1 | `lib/canvas.ts` — "To [name]" font 28→30px (nearly same as 34px note text) | ✅ |
| 12.2 | `lib/canvas.ts` — Date moved from top bar (above photo) → bottom bar at `CARD_H - 44`, above "✦ Starry" | ✅ |
| 12.3 | `lib/canvas.ts` — Full-width meteor shower: 13 meteors per bar spanning entire 1080px width; no safe-zone restriction; ~12 stars per bar spread across full width | ✅ |

---

## Sprint 13: Meteor Direction Fix + Explore Page Starry Background ✅

| Step | Description | Status |
|------|-------------|--------|
| 13.1 | `lib/canvas.ts` — reverse gradient in `drawMeteor()`: bright head now at `(x2,y2)` lower-left, fading tail at `(x1,y1)` upper-right; bright dot moved to `(x2,y2)` | ✅ |
| 13.2 | `components/StarryBackground.tsx` — canvas-based animated background: ~80–160 twinkling stars, occasional shooting stars (head at lower-left), subtle nebula radial gradients | ✅ |
| 13.3 | `app/explore/page.tsx` — import and render `<StarryBackground />` as first child; header + content given `z-[1]` to stay above canvas | ✅ |

---

## Sprint 14: Auth 修复 & Sign-Out ✅

| Step | Description | Status |
|------|-------------|--------|
| 1.1 | Supabase Dashboard: set Site URL → `https://starry-neon.vercel.app`, add Redirect URL `https://starry-neon.vercel.app/**` | ✅ (manual) |
| 1.2 | Vercel Dashboard: set `NEXT_PUBLIC_APP_URL=https://starry-neon.vercel.app` in Production env | ✅ (manual) |
| 1.3 | `AuthModal.tsx` — `emailRedirectTo` uses `NEXT_PUBLIC_APP_URL` env var, fallback to `window.location.origin` | ✅ |
| 2.1–2.3 | `TimelineView.tsx` — `handleSignOut` + sign-out button in both empty-state and non-empty header | ✅ |
| 3.1 | `explore/page.tsx` — clean up `?auth_return=1` via `window.history.replaceState` after draft restore | ✅ |
| 3.2 | `explore/page.tsx` — friendly error message when draft is missing on auth return | ✅ |

---

---

## Sprint 15: Meteor Shower Messages (流星雨心声) ✅

Community message board where users send anonymous 50-char wishes that fly as shooting stars on `/meteors`.

| Step | Description | Status |
|------|-------------|--------|
| 1.1 | SQL migration — `meteors` table + RLS policies (manual, run in Supabase Dashboard) | ✅ (manual) |
| 1.2 | `src/lib/profanity.ts` — word-boundary regex filter (~80 English terms) | ✅ |
| 1.3 | `POST /api/meteors` — auth-gated submit with profanity check + analytics | ✅ |
| 1.4 | `GET /api/meteors` — public paginated fetch (limit/before cursor) | ✅ |
| 1.5 | `GET /api/meteors/count` — cumulative total with 5-min cache | ✅ |
| 1.6 | `analytics.ts` — added `meteor_sent` + `meteor_page_view` event types | ✅ |
| 2.0 | `AuthModal.tsx` — `returnTo` prop for dynamic redirect; `draft.ts` — MeteorDraft interface + save/load/clear | ✅ |
| 2.1 | `MeteorInput.tsx` — category picker + 50-char input + auth gate + prefill support | ✅ |
| 2.2 | `ShareModal.tsx` — "Send a meteor wish ✦" CTA when logged in | ✅ |
| 2.3 | `explore/page.tsx` — meteor CTA in saved banner + "Wishes" nav link | ✅ |
| 3.1 | `MeteorShower.tsx` — hybrid canvas/DOM: star bg + meteor trails + glowing dots + message cards | ✅ |
| 3.2 | `MeteorOnboarding.tsx` — first-visit hint (5s auto-fade, localStorage flag) | ✅ |
| 3.3 | `app/meteors/page.tsx` + `client.tsx` — full-screen meteor page + auth return handling | ✅ |
| 4.1 | `page.tsx` — "Wishes ✦" nav link between Gift and My Starry | ✅ |
| 4.2 | `page.tsx` — cumulative meteor count below CTA, links to `/meteors` | ✅ |
| 4.3 | `explore/page.tsx` — "Wishes" nav link in explore header | ✅ |
| 5.1 | Seed messages — insert 5-10 sample meteors in Supabase Dashboard (manual) | ✅ (manual) |

---

## Sprint 15 Bugfix: MeteorInput displayName + Immediate Feedback ✅

| Fix | Description | Status |
|-----|-------------|--------|
| 1 | `MeteorInput.tsx` — added editable `nameVal` state; name input shown when `displayName` prop absent; `effectiveName` used in draft/API; `onSuccess` now passes `{id, displayName, message, category}` | ✅ |
| 2 | `MeteorShower.tsx` — added `newMeteor` prop for immediate launch; `processedIdsRef` prevents duplicates; `messages` effect only initializes queue once (no re-fly on update) | ✅ |
| 3 | `client.tsx` — removed `displayName` state; added `prefillDisplayName` + `newMeteor` state; `onSuccess` sets `newMeteor` directly instead of re-fetching; auth return passes `prefillDisplayName` | ✅ |

---

## Sprint 16: Analytics Bug Fix — Remove Duplicate `meteor_sent` ✅

| Fix | Description | Status |
|-----|-------------|--------|
| 1 | `MeteorInput.tsx` — removed `trackEvent('meteor_sent', { category })` frontend call; backend `POST /api/meteors` already writes the event with more context (`meteorId`, `user_id`); removed now-unused `trackEvent` import | ✅ |

---

## Deployment ✅

| Item | Detail |
|------|--------|
| Platform | Vercel |
| Public URL | https://starry-neon.vercel.app/ |
| Status | Live |