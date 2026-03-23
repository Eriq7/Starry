/**
 * app/meteors/client.tsx
 *
 * Client component for the /meteors page.
 * Full-screen interactive meteor shower — displays anonymous messages from the DB
 * as animated shooting stars that land as clickable glowing dots.
 *
 * Auth return handling: if ?auth_return=1 is present, loads MeteorDraft from
 * localStorage and auto-submits the pending meteor message.
 *
 * Header: ✦ STARRY + Home + My Starry links
 * Footer: "Send your own wish ✦" CTA → opens MeteorInput (auth-gated)
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import MeteorInput from '@/components/MeteorInput'
import MeteorOnboarding from '@/components/MeteorOnboarding'
import { loadMeteorDraft, clearMeteorDraft } from '@/lib/draft'
import { trackEvent } from '@/lib/analytics'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

const MeteorShower = dynamic(() => import('@/components/MeteorShower'), { ssr: false })

interface MeteorMessage {
  id: string
  displayName: string
  message: string
  category: 'wish' | 'reflection' | 'warmth'
  createdAt: string
}

function MeteorShowerClientInner() {
  const searchParams = useSearchParams()
  const authReturn = searchParams.get('auth_return') === '1'

  const [messages, setMessages] = useState<MeteorMessage[]>([])
  const [showMeteorInput, setShowMeteorInput] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [prefillDisplayName, setPrefillDisplayName] = useState('')
  const [prefillMessage, setPrefillMessage] = useState('')
  const [prefillCategory, setPrefillCategory] = useState<'wish' | 'reflection' | 'warmth'>('wish')
  const [newMeteor, setNewMeteor] = useState<MeteorMessage | undefined>(undefined)

  // Check auth state
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

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

  // Handle auth return — restore draft and auto-submit
  useEffect(() => {
    if (!authReturn) return

    // Clean URL
    window.history.replaceState({}, '', '/meteors')

    const draft = loadMeteorDraft()
    if (!draft) return

    // Pre-fill and open the input modal for auto-submit
    setPrefillMessage(draft.message)
    setPrefillCategory(draft.category)
    setPrefillDisplayName(draft.displayName)
    setShowMeteorInput(true)
    clearMeteorDraft()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReturn])

  function handleSendWish() {
    setShowMeteorInput(true)
  }

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
          onClick={handleSendWish}
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
          prefillDisplayName={prefillDisplayName}
          eventDate={undefined}
          isLoggedIn={isLoggedIn}
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
          prefillMessage={prefillMessage}
          prefillCategory={prefillCategory}
        />
      )}
    </main>
  )
}

export default function MeteorShowerClient() {
  return (
    <Suspense>
      <MeteorShowerClientInner />
    </Suspense>
  )
}
