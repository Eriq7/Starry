/**
 * lib/analytics.ts
 *
 * Funnel event tracking utility. Emits events to the Supabase `events` table.
 * Works for both anonymous users (session_id from localStorage) and logged-in users.
 *
 * All core funnel events are defined here as a type to prevent typos.
 * Events are non-blocking — failures are logged but never thrown.
 */

import { getSupabaseBrowser } from './supabase-browser'

const SESSION_KEY = 'starry_session_id'

export type EventType =
  | 'page_view'
  | 'date_entered'
  | 'photo_loaded'
  | 'card_generated'
  | 'card_downloaded'
  | 'caption_copied'
  | 'card_shared'
  | 'gift_created'
  | 'gift_viewed'
  | 'gift_converted'
  | 'card_saved_to_timeline'
  | 'meteor_sent'
  | 'meteor_page_view'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export async function trackEvent(
  type: EventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('events').insert({
      event_type: type,
      user_id: user?.id ?? null,
      session_id: getSessionId(),
      metadata: metadata ?? null,
    })
  } catch (err) {
    // Analytics must never break the user experience
    console.warn('[analytics] trackEvent failed:', err)
  }
}
