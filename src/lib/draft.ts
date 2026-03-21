/**
 * lib/draft.ts
 *
 * localStorage draft management for the anonymous → auth flow.
 *
 * When a user fills in date/note/keywords before logging in, we persist
 * their work to localStorage immediately. After Magic Link redirect, we
 * read the draft back to re-generate the card and save to DB.
 *
 * Important: Never assume localStorage context survives the email redirect —
 * always read the draft fresh after auth return.
 */

const DRAFT_KEY = 'starry_draft'

export interface Draft {
  date: string           // user's entered date (YYYY-MM-DD)
  resolvedDate: string   // actual APOD date used
  note: string
  keywords: string[]
  apodTitle: string
  apodCopyright?: string
  savedAt: number        // Unix ms timestamp for staleness checks
}

export function saveDraft(draft: Omit<Draft, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  const full: Draft = { ...draft, savedAt: Date.now() }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(full))
}

export function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as Draft
    // Discard drafts older than 24 hours
    if (Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
      clearDraft()
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_KEY)
}

export function hasDraft(): boolean {
  return loadDraft() !== null
}
