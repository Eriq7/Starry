/**
 * app/profile/page.tsx
 *
 * "My Starry" — the user's personal timeline.
 *
 * Server component: authenticates the user, fetches their saved nodes, then
 * hands off to the <TimelineView> client component for the full-screen
 * scroll-snap timeline experience.
 *
 * Auth redirect: unauthenticated users are sent to /explore.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import TimelineView from '@/components/TimelineView'
import type { TimelineNode } from '@/components/TimelineCard'

export const metadata: Metadata = {
  title: 'My Starry — Starry',
}

export default async function ProfilePage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/explore')
  }

  const { data: nodes, error } = await supabase
    .from('nodes')
    .select(
      'id, event_date, resolved_apod_date, note, keywords, apod_title, apod_copyright, card_image_url, created_at'
    )
    .eq('user_id', user.id)
    .order('event_date', { ascending: false })

  if (error) {
    console.error('[profile] fetch nodes error:', error.message)
  }

  const nodeList: TimelineNode[] = nodes ?? []

  return <TimelineView nodes={nodeList} />
}
