/**
 * components/MeteorOnboarding.tsx
 *
 * First-visit onboarding hint for the /meteors page.
 * Checks localStorage for 'starry_meteor_onboarded' flag.
 * On first visit: shows a bottom hint "Tap a glowing star to read someone's wish"
 * that fades after 5 seconds. Flag is set when dismissed.
 */

'use client'

import { useEffect, useState } from 'react'

const ONBOARDED_KEY = 'starry_meteor_onboarded'

export default function MeteorOnboarding() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(ONBOARDED_KEY)) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        localStorage.setItem(ONBOARDED_KEY, '1')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(ONBOARDED_KEY, '1')
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-20 px-5 py-3 rounded-2xl text-center"
      style={{
        background: 'rgba(15,15,46,0.92)',
        border: '1px solid rgba(129,140,248,0.25)',
        boxShadow: '0 0 24px rgba(99,102,241,0.2)',
        animation: 'fade-in-up 0.5s ease-out, fade-out 0.5s ease-in 4.5s forwards',
        backdropFilter: 'blur(8px)',
      }}
      onClick={dismiss}
    >
      <p className="text-sm text-white/70">
        ✦ Tap a glowing star to read someone&apos;s wish
      </p>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fade-out {
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
