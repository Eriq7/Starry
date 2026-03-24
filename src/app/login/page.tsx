/**
 * app/login/page.tsx
 *
 * Auth-first login page — the entry point for all unauthenticated users.
 *
 * Middleware redirects every protected route here, passing the intended
 * destination as `?returnTo=<path>`. After Magic Link auth, the user
 * lands back at their original destination.
 *
 * If the user is already authenticated, they are immediately redirected
 * to `returnTo` (or `/` as fallback).
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? '/'
  const authError = searchParams.get('auth_error') === '1'

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // If already logged in, skip login and go to destination
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(returnTo)
    })
  }, [router, returnTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMsg(null)

    const supabase = getSupabaseBrowser()
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(returnTo)}`

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
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          'radial-gradient(ellipse at 20% 50%, #0d0d2e 0%, #030712 60%, #000 100%)',
      }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <span
          className="font-cinzel text-2xl tracking-widest"
          style={{ color: '#818cf8' }}
        >
          ✦ STARRY
        </span>
        <p className="mt-2 text-sm text-white/40">Your universe, your moments</p>
      </div>

      <div
        className="w-full max-w-sm rounded-3xl p-6 space-y-5"
        style={{
          background: 'linear-gradient(160deg, #0f0f2e 0%, #030712 100%)',
          border: '1px solid rgba(129,140,248,0.25)',
          boxShadow: '0 0 60px rgba(99,102,241,0.2)',
        }}
      >
        {status !== 'sent' ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-2xl">✦</p>
              <h1 className="text-lg font-light text-white">Sign in to explore</h1>
              <p className="text-sm text-white/50">
                No password needed — we&apos;ll send you a magic link.
              </p>
            </div>

            {authError && (
              <p className="text-xs text-red-400 text-center">
                Sign-in link expired. Please try again.
              </p>
            )}

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
              No password needed. One tap and you&apos;re in.
            </p>
          </>
        ) : (
          <div className="text-center space-y-3 py-4">
            <p className="text-3xl">📬</p>
            <h2 className="text-lg font-light text-white">Check your inbox</h2>
            <p className="text-sm text-white/50">
              We sent a magic link to{' '}
              <strong className="text-white/80">{email}</strong>.
              <br />
              Click it to continue to Starry.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
