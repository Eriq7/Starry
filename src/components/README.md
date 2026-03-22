# src/components/

UI components for Starry. All components are client components (`'use client'`) unless noted.

## Architecture

Components are small, focused, and stateless where possible — state lives in the page
(`explore/page.tsx`) and flows down as props.

## Components

| File | Purpose |
|------|---------|
| `DateInput.tsx` | Controlled date picker. Max=today; pre-1995 calls `onPreApod` for curated gallery flow. |
| `PhotoDisplay.tsx` | Renders an APOD photo from `/api/apod/image/[date]`. Shows loading skeleton, emits `photo_loaded` event. |
| `KeywordPicker.tsx` | Chip-style multi-select for keywords. Shows AI-suggested keywords + custom input. 1–4 selections. |
| `ShareCard.tsx` | Mounts a Canvas-based card preview. Wraps `lib/canvas.ts`. Disposes canvas on unmount. |
| `ShareModal.tsx` | Bottom sheet modal with Download / Copy Caption / Web Share actions. Handles anonymous gating. |
| `AuthModal.tsx` | Magic Link login modal. Triggered when anonymous user tries to download. Preserves draft context. |
| `TimelineCard.tsx` | Full-screen (100dvh) card for one saved node. APOD photo background, lazy-loaded, share button. |
| `TimelineView.tsx` | Scroll-snap vertical timeline container. IntersectionObserver tracks active card, lazy loads ±1. |
| `CuratedGallery.tsx` | Pre-1995 fallback: responsive grid of curated APOD photos with category filter. |

## Data flow

```
explore/page.tsx (state owner)
  ├── DateInput      → onSubmit(date)
  ├── PhotoDisplay   → purely display, emits analytics
  ├── KeywordPicker  → onChange(keywords[])
  ├── [note textarea]
  └── ShareModal
        ├── ShareCard (canvas preview)
        └── AuthModal (if not logged in)
```

## Notes

- Images are always loaded via `/api/apod/image/[date]` (same-origin proxy).
  This prevents Canvas tainting on iOS Safari and other strict-CORS browsers.
- Analytics events are emitted at key moments in each component — see `lib/analytics.ts`.
