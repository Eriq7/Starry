/**
 * components/AuthButton.tsx
 *
 * Client component that renders a context-aware Sign in / Sign out button.
 *
 * - Listens to Supabase auth state changes via onAuthStateChange
 * - Unauthenticated: renders "Sign in" — opens AuthModal on click
 * - Authenticated: renders "Sign out" — calls supabase.auth.signOut() and reloads
 *
 * Designed to sit inside a nav header alongside other link elements.
 * Accepts an optional `className` override; defaults to the standard nav-link style.
 */

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import type { Session } from '@supabase/supabase-js'

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false })

interface AuthButtonProps {
  className?: string
}

export default function AuthButton({ className }: AuthButtonProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = getSupabaseBrowser()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const baseClass =
    className ?? 'text-sm text-white/50 hover:text-white/80 transition-colors'

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) return null

  if (session) {
    return (
      <button onClick={handleSignOut} className={baseClass}>
        Sign out
      </button>
    )
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className={baseClass}>
        Sign in
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  )
}
