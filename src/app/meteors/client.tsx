/**
 * app/meteors/client.tsx
 *
 * Client component for the /meteors page.
 * Full-screen interactive meteor shower — displays messages from the DB
 * as animated shooting stars that land as clickable glowing dots.
 *
 * All users are authenticated before reaching this page (auth-first).
 * The "Send wish" button opens MeteorInput directly — no auth gating needed.
 *
 * Header: ✦ STARRY + Home + My Starry links
 * Footer: "Send your own wish ✦" CTA → opens MeteorInput
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import MeteorInput from '@/components/MeteorInput'
import MeteorOnboarding from '@/components/MeteorOnboarding'
import { trackEvent } from '@/lib/analytics'

const MeteorShower = dynamic(() => import('@/components/MeteorShower'), { ssr: false })

interface MeteorMessage {
  id: string
  displayName: string
  message: string
  category: 'wish' | 'reflection' | 'warmth'
  createdAt: string
}

export default function MeteorShowerClient() {
  const [messages, setMessages] = useState<MeteorMessage[]>([])
  const [showMeteorInput, setShowMeteorInput] = useState(false)
  const [newMeteor, setNewMeteor] = useState<MeteorMessage | undefined>(undefined)

  // Track page view
  useEffect(() => {
    trackEvent('meteor_page_view', { page: 'meteors' })
  }, [])

  // Fetch meteor messages
  useEffect(() => {
    fetch('/api/meteors?limit=30')
      .then((res) => res.json())
      .then((data) => {
        if (data.meteors) setMessages(data.meteors)
      })
      .catch(() => {/* non-critical */})
  }, [])

  return (
    <main className="relative min-h-screen" style={{ background: '#030712' }}>
      {/* Full-screen animated meteor shower */}
      <MeteorShower messages={messages} newMeteor={newMeteor} />

      {/* Header — z-10 above canvas */}
      <header
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 pt-8 pb-4"
        style={{ zIndex: 10 }}
      >
        <span
          className="font-cinzel text-lg tracking-widest"
          style={{ color: '#818cf8' }}
        >
          ✦ STARRY
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/profile"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            My Starry
          </Link>
        </div>
      </header>

      {/* Onboarding hint (first visit only) */}
      <MeteorOnboarding />

      {/* Footer CTA — z-10 above canvas */}
      <footer
        className="fixed bottom-0 left-0 right-0 flex flex-col items-center pb-10 pt-4"
        style={{ zIndex: 10 }}
      >
        <button
          onClick={() => setShowMeteorInput(true)}
          className="px-8 py-3 rounded-full text-sm font-medium tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            boxShadow: '0 0 32px rgba(99,102,241,0.35)',
          }}
        >
          Send your own wish ✦
        </button>
      </footer>

      {/* Meteor input modal */}
      {showMeteorInput && (
        <MeteorInput
          eventDate={undefined}
          onClose={() => setShowMeteorInput(false)}
          onSuccess={(data) => {
            setShowMeteorInput(false)
            // Inject the new meteor directly for immediate visual feedback
            setNewMeteor({
              id: data.id,
              displayName: data.displayName,
              message: data.message,
              category: data.category,
              createdAt: new Date().toISOString(),
            })
          }}
        />
      )}
    </main>
  )
}
