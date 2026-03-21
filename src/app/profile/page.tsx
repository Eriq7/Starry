/**
 * app/profile/page.tsx
 *
 * Profile page — "My Stars"
 *
 * Server-rendered page listing the authenticated user's saved nodes.
 * Redirects to /explore if the user is not logged in.
 *
 * Each card shows the APOD thumbnail, date, note, and keywords.
 * Clicking a card opens the share card image via /api/cards/[nodeId] (or the
 * APOD photo as fallback) in a new tab — no re-render required.
 *
 * Card images are served through /api/cards/[nodeId], which authenticates the
 * caller and proxies the PNG from the private "cards" Storage bucket.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'My Stars — Starry',
}

interface Node {
  id: string
  event_date: string
  resolved_apod_date: string
  note: string | null
  keywords: string[] | null
  apod_title: string | null
  apod_copyright: string | null
  card_image_url: string | null
  created_at: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
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

  const nodeList: Node[] = nodes ?? []

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#030712' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4 shrink-0">
        <Link
          href="/"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Home
        </Link>
        <span
          className="text-lg font-light tracking-widest"
          style={{ color: '#818cf8' }}
        >
          ✦ STARRY
        </span>
        <Link
          href="/explore"
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          + New
        </Link>
      </header>

      <div className="flex-1 px-6 pb-12">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-light text-white mb-1 mt-8">My Stars</h1>
          <p className="text-sm text-white/40 mb-8">
            {nodeList.length === 0
              ? 'No moments saved yet.'
              : `${nodeList.length} moment${nodeList.length === 1 ? '' : 's'} captured`}
          </p>

          {nodeList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">✦</p>
              <p className="text-white/50 text-sm mb-6">
                Your universe is waiting to be mapped.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                }}
              >
                Explore a date
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {nodeList.map((node) => (
                <a
                  key={node.id}
                  href={node.card_image_url ? `/api/cards/${node.id}` : `/api/apod/image/${node.resolved_apod_date}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {/* APOD thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/apod/image/${node.resolved_apod_date}`}
                    alt={node.apod_title ?? 'Astronomy photo'}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />

                  <div className="p-4 space-y-2">
                    <p className="text-xs text-white/40 uppercase tracking-wide">
                      {formatDate(node.event_date)}
                    </p>

                    {node.note && (
                      <p className="text-white text-sm font-medium leading-snug">
                        {node.note}
                      </p>
                    )}

                    {node.apod_title && (
                      <p className="text-white/50 text-xs leading-relaxed">
                        {node.apod_title}
                      </p>
                    )}

                    {node.keywords && node.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {node.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-xs px-2.5 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(129,140,248,0.15)',
                              color: '#a5b4fc',
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
