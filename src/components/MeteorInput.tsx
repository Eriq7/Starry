/**
 * components/MeteorInput.tsx
 *
 * Modal composer for writing and submitting a meteor wish message.
 * Allows the user to pick a category, optionally enter a display name,
 * and write a 50-char anonymous message.
 *
 * Auth flow: if the user is not logged in when they submit, saves a MeteorDraft
 * to localStorage and opens AuthModal with returnTo="/meteors".
 *
 * Props:
 *  - displayName: confirmed name from parent (e.g. ShareModal). If present, hides
 *    the name input field since the name is already known.
 *  - prefillDisplayName: editable pre-fill for the name field (e.g. from auth
 *    return draft). Only used when displayName is not provided.
 *  - eventDate: optional APOD date associated with the user's card
 *  - onClose: dismiss handler
 *  - onSuccess: called with submitted data after successful submission
 */

'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'
import { saveMeteorDraft } from '@/lib/draft'

type Category = 'wish' | 'reflection' | 'warmth'

interface MeteorInputProps {
  /** Confirmed name from parent — if present, hides the name input */
  displayName?: string
  /** Editable pre-fill for the name field (from auth return draft) */
  prefillDisplayName?: string
  eventDate?: string
  isLoggedIn: boolean
  onClose: () => void
  onSuccess?: (data: { id: string; displayName: string; message: string; category: Category }) => void
  /** Pre-fill message text (used after auth return from /meteors) */
  prefillMessage?: string
  /** Pre-fill category (used after auth return from /meteors) */
  prefillCategory?: Category
}

const CATEGORIES: { value: Category; icon: string; label: string }[] = [
  { value: 'wish',       icon: '✦', label: 'A wish for the future' },
  { value: 'reflection', icon: '☽', label: 'A reflection on life' },
  { value: 'warmth',     icon: '♡', label: 'Warmth to a stranger' },
]

export default function MeteorInput({
  displayName,
  prefillDisplayName = '',
  eventDate,
  isLoggedIn,
  onClose,
  onSuccess,
  prefillMessage = '',
  prefillCategory = 'wish',
}: MeteorInputProps) {
  const [category, setCategory] = useState<Category>(prefillCategory)
  const [message, setMessage] = useState(prefillMessage)
  // nameVal: editable internally; initialised from confirmed displayName or draft prefill
  const [nameVal, setNameVal] = useState(displayName || prefillDisplayName || '')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'profanity'>('idle')
  const [showAuth, setShowAuth] = useState(false)

  // The name we actually send — confirmed prop takes priority
  const effectiveName = displayName || nameVal

  async function handleSubmit() {
    if (!message.trim() || !effectiveName.trim() || status === 'submitting') return

    if (!isLoggedIn) {
      // Save draft (with user-typed name) and prompt auth
      saveMeteorDraft({ message, category, displayName: effectiveName, eventDate })
      setShowAuth(true)
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/meteors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, category, displayName: effectiveName, eventDate }),
      })
      const resData = await res.json()
      if (res.ok) {
        setStatus('success')
        onSuccess?.({ id: resData.id, displayName: effectiveName, message, category })
      } else {
        if (resData.error?.includes('inappropriate')) {
          setStatus('profanity')
        } else {
          setStatus('error')
        }
      }
    } catch {
      setStatus('error')
    }
  }

  const selectedCat = CATEGORIES.find((c) => c.value === category)!

  return (
    <>
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

          {status === 'success' ? (
            <div className="text-center space-y-3 py-6">
              <p className="text-3xl">✦</p>
              <h2 className="text-lg font-light text-white">
                Your wish is flying across the sky ✦
              </h2>
              <p className="text-sm text-white/50">
                Others will see it on the meteors page.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl text-sm text-white/70 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <p className="text-2xl">{selectedCat.icon}</p>
                <h2 className="text-lg font-light text-white">Send a meteor wish</h2>
                <p className="text-sm text-white/50">
                  Your message flies anonymously across the sky.
                </p>
              </div>

              {/* Category selector */}
              <div className="flex flex-col gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150"
                    style={{
                      background: category === cat.value
                        ? 'rgba(129,140,248,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      border: category === cat.value
                        ? '1px solid rgba(129,140,248,0.45)'
                        : '1px solid rgba(255,255,255,0.1)',
                      color: category === cat.value ? '#c7d2fe' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Name input — only shown when no confirmed displayName from parent */}
              {!displayName && (
                <input
                  type="text"
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value.slice(0, 15))}
                  placeholder="Your name (max 15 chars)"
                  maxLength={15}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                />
              )}

              {/* Message input */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value.slice(0, 50))
                    if (status !== 'idle') setStatus('idle')
                  }}
                  placeholder="Write your wish…"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-white/30">
                    {effectiveName && `— ${effectiveName}`}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: message.length >= 45 ? '#f87171' : 'rgba(255,255,255,0.25)' }}
                  >
                    {message.length}/50
                  </span>
                </div>
              </div>

              {/* Error states */}
              {status === 'profanity' && (
                <p className="text-xs text-red-400 text-center">
                  Message contains inappropriate content.
                </p>
              )}
              {status === 'error' && (
                <p className="text-xs text-red-400 text-center">
                  Something went wrong. Please try again.
                </p>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || !effectiveName.trim() || status === 'submitting'}
                className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  boxShadow: '0 0 24px rgba(99,102,241,0.3)',
                }}
              >
                {status === 'submitting' ? 'Sending…' : 'Send into the sky ✦'}
              </button>
            </>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          returnTo="/meteors"
        />
      )}
    </>
  )
}
