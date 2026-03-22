/**
 * components/AuthModal.tsx
 *
 * Magic Link authentication modal.
 * Shown when an anonymous user attempts a gated action (Download / Save).
 *
 * Flow:
 *  1. User enters email → Supabase sends Magic Link
 *  2. User clicks link in email → /auth/callback route → /explore?auth_return=1
 *  3. Explore page detects auth_return, reads localStorage draft, re-triggers save flow
 *
 * The draft is preserved in localStorage before this modal is shown
 * (the explore page writes it whenever note/keywords change).
 */

'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface AuthModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMsg(null)

    const supabase = getSupabaseBrowser()
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    const redirectTo = `${baseUrl}/auth/callback?next=/explore`

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 space-y-5"
        style={{
          background: 'linear-gradient(160deg, #0f0f2e 0%, #030712 100%)',
          border: '1px solid rgba(129,140,248,0.25)',
          boxShadow: '0 0 60px rgba(99,102,241,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
        >
          ×
        </button>

        {status !== 'sent' ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-2xl">✦</p>
              <h2 className="text-lg font-light text-white">Save your universe</h2>
              <p className="text-sm text-white/50">
                Sign in with your email to download and save your card.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                }}
              >
                {status === 'sending' ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>

            <p className="text-xs text-center text-white/25">
              No password needed. One tap and you're in.
            </p>
          </>
        ) : (
          <div className="text-center space-y-3 py-4">
            <p className="text-3xl">📬</p>
            <h2 className="text-lg font-light text-white">Check your inbox</h2>
            <p className="text-sm text-white/50">
              We sent a magic link to <strong className="text-white/80">{email}</strong>.
              <br />
              Click it to return and save your card.
            </p>
            <p className="text-xs text-white/25 pt-2">
              Your draft is saved — it'll be here when you return.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
