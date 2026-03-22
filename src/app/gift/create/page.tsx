/**
 * app/gift/create/page.tsx
 *
 * Gift creation page — lets a logged-in user gift a star moment to a friend.
 *
 * Form fields:
 *  - Friend's name (recipientName)
 *  - Important date (eventDate — reuses the same date input UX)
 *  - Optional personal message
 *
 * Auth gating: if not logged in, shows an inline prompt to sign in first
 * (AuthModal is opened on submit attempt).
 *
 * On success: shows the shareable gift URL with a copy button.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { APOD_START_DATE } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'

export default function GiftCreatePage() {
  const [recipientName, setRecipientName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [giftUrl, setGiftUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isLoggedIn) {
      setShowAuth(true)
      return
    }

    if (!recipientName.trim()) {
      setError("Enter your friend's name.")
      return
    }
    if (!eventDate) {
      setError('Choose a date.')
      return
    }
    if (eventDate < APOD_START_DATE) {
      setError('Date must be June 16, 1995 or later.')
      return
    }
    if (eventDate > today) {
      setError("You can't send future stars.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName, eventDate, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create gift.')
        return
      }
      const fullUrl = `${window.location.origin}${data.giftUrl}`
      setGiftUrl(fullUrl)
      trackEvent('gift_created', { eventDate })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!giftUrl) return
    await navigator.clipboard.writeText(giftUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#030712' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <Link href="/" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
          ← Home
        </Link>
        <span className="font-cinzel text-lg tracking-widest" style={{ color: '#818cf8' }}>
          ✦ STARRY
        </span>
        <Link href="/profile" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
          My Starry
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pb-12">
        <div className="w-full max-w-sm pt-10">
          <div className="text-center mb-8">
            <p className="text-3xl mb-3">✦</p>
            <h1 className="font-cinzel text-2xl text-white mb-2">Gift a Starry</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Send someone the universe as it looked on their most important day.
            </p>
          </div>

          {/* Success state */}
          {giftUrl ? (
            <div
              className="rounded-2xl p-6 space-y-5 text-center"
              style={{
                background: 'rgba(129,140,248,0.08)',
                border: '1px solid rgba(129,140,248,0.25)',
              }}
            >
              <p className="text-4xl">🎁</p>
              <div>
                <p className="text-white font-medium mb-1">Gift created!</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Share this link with {recipientName}
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-xs break-all"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a5b4fc',
                }}
              >
                {giftUrl}
              </div>
              <button
                onClick={handleCopy}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: copied
                    ? 'rgba(34,197,94,0.2)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: copied ? '1px solid rgba(34,197,94,0.4)' : 'none',
                  color: copied ? '#86efac' : 'white',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy link'}
              </button>
              <button
                onClick={() => {
                  setGiftUrl(null)
                  setRecipientName('')
                  setEventDate('')
                  setMessage('')
                }}
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Create another gift
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Friend's name */}
              <div>
                <label className="block text-sm mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Friend's name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Alex"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px rgba(129,140,248,0.5)')}
                  onBlur={(e) => (e.target.style.boxShadow = '')}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Their important date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={APOD_START_DATE}
                  max={today}
                  className="w-full px-4 py-3 rounded-xl text-white text-base appearance-none outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px rgba(129,140,248,0.5)')}
                  onBlur={(e) => (e.target.style.boxShadow = '')}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Personal message{' '}
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="You've always looked up at the same stars…"
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 outline-none resize-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                  onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px rgba(129,140,248,0.5)')}
                  onBlur={(e) => (e.target.style.boxShadow = '')}
                />
                <p className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {message.length}/200
                </p>
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-sm font-medium tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  boxShadow: '0 0 28px rgba(99,102,241,0.25)',
                }}
              >
                {loading ? 'Creating gift…' : 'Create gift link ✦'}
              </button>

              {!isLoggedIn && (
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  You'll need to sign in to create a gift
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </main>
  )
}
