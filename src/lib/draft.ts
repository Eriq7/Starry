/**
 * lib/draft.ts
 *
 * Type definition for a moment node draft — used by the card save flow
 * (explore/page.tsx → saveNode → /api/nodes).
 *
 * The localStorage draft persistence system has been removed now that
 * the app is auth-first. This file is kept for the Draft type used by
 * nodes.ts (client) and api/nodes/route.ts (server).
 */

export interface Draft {
  date: string           // user's entered date (YYYY-MM-DD)
  resolvedDate: string   // actual APOD date used
  note: string
  displayName: string    // name shown in "To [name]" on the card (max 15 chars)
  keywords: string[]
  apodTitle: string
  apodCopyright?: string
}
