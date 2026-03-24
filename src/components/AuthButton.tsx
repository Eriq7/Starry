/**
 * components/AuthButton.tsx
 *
 * Sign-out button for authenticated users.
 *
 * Since the app is auth-first, users are always authenticated when this
 * component renders. It simply provides a way to sign out.
 *
 * After sign-out, `window.location.reload()` triggers the middleware which
 * detects no session and redirects to /login.
 */

'use client'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface AuthButtonProps {
  className?: string
}

export default function AuthButton({ className }: AuthButtonProps) {
  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const baseClass =
    className ?? 'text-sm text-white/50 hover:text-white/80 transition-colors'

  return (
    <button onClick={handleSignOut} className={baseClass}>
      Sign out
    </button>
  )
}
