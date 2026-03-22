/**
 * components/ShareModal.tsx
 *
 * Share modal — appears after the user previews their card.
 * Three actions:
 *  1. Download image (gated behind auth for anonymous users)
 *  2. Add to My Starry (saves card to timeline DB; opens auth for anonymous users)
 *  3. Web Share API (system share sheet on mobile; download fallback on desktop)
 *
 * For anonymous users, Download and "Add to My Starry" trigger the auth modal.
 * Web Share always works — important for virality.
 */

'use client'

import { useRef, useState } from 'react'
import ShareCard from './ShareCard'
import AuthModal from './AuthModal'
import { downloadCard, canvasToBlob, type CardOptions } from '@/lib/canvas'
import { trackEvent } from '@/lib/analytics'

interface ShareModalProps {
  options: CardOptions
  isLoggedIn: boolean
  onClose: () => void
  /** Called when user has just authenticated via this modal */
  onAuthSuccess?: () => void
  /** Called with the canvas element once the card has been rendered */
  onCardReady?: (canvas: HTMLCanvasElement) => void
  /** Called when user clicks "Add to My Starry" and is logged in */
  onSaveToTimeline?: () => Promise<void>
}

function buildCaption(note: string, title: string): string {
  if (note.trim()) {
    return `${note.trim()}\n\nThe universe that day: "${title}"\n\n✦ Starry`
  }
  return `"${title}" — captured by NASA.\n\nWhat did your universe look like?\n\n✦ Starry`
}

export default function ShareModal({
  options,
  isLoggedIn,
  onClose,
  onAuthSuccess,
  onCardReady,
  onSaveToTimeline,
}: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [timelineSaveState, setTimelineSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const caption = buildCaption(options.note, options.apodTitle)
  const filename = `starry-${options.date}.png`

  async function handleDownload() {
    if (!isLoggedIn) {
      setShowAuth(true)
      return
    }
    if (!canvasRef.current) return
    await downloadCard(canvasRef.current, filename)
    trackEvent('card_downloaded', { date: options.date })
  }

  async function handleAddToTimeline() {
    if (!isLoggedIn) {
      setShowAuth(true)
      return
    }
    if (timelineSaveState === 'saving' || timelineSaveState === 'saved') return
    setTimelineSaveState('saving')
    try {
      await onSaveToTimeline?.()
      setTimelineSaveState('saved')
      trackEvent('card_saved_to_timeline', { date: options.date })
    } catch {
      setTimelineSaveState('error')
    }
  }

  async function handleShare() {
    if (!canvasRef.current) return

    // Try Web Share API (mobile native share sheet)
    if (navigator.share) {
      try {
        const blob = await canvasToBlob(canvasRef.current)
        const file = new File([blob], filename, { type: 'image/png' })
        await navigator.share({
          title: 'My Universe on Starry',
          text: caption,
          files: [file],
        })
        trackEvent('card_shared', { date: options.date, method: 'web_share_api' })
        return
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // Desktop fallback: download
    await handleDownload()
    trackEvent('card_shared', { date: options.date, method: 'download_fallback' })
  }

  const timelineIcon =
    timelineSaveState === 'saving' ? '⏳' :
    timelineSaveState === 'saved'  ? '✅' : '⭐'

  const timelineLabel =
    timelineSaveState === 'saving' ? 'Saving…' :
    timelineSaveState === 'saved'  ? 'Added!' :
    timelineSaveState === 'error'  ? 'Error' :
    !isLoggedIn                    ? 'Sign in' : 'Add to My Starry'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm rounded-3xl p-4 space-y-4"
          style={{
            background: 'linear-gradient(160deg, #0f0f2e 0%, #030712 100%)',
            border: '1px solid rgba(129,140,248,0.2)',
            boxShadow: '0 0 60px rgba(99,102,241,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
          >
            ×
          </button>

          {/* Card preview */}
          <ShareCard options={options} onReady={(c) => { canvasRef.current = c; onCardReady?.(c) }} />

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(129,140,248,0.12)',
                border: '1px solid rgba(129,140,248,0.2)',
              }}
            >
              <span className="text-xl">⬇️</span>
              <span className="text-xs text-white/70">
                {isLoggedIn ? 'Save' : 'Sign in'}
              </span>
            </button>

            {/* Add to My Starry */}
            <button
              onClick={handleAddToTimeline}
              disabled={timelineSaveState === 'saving' || timelineSaveState === 'saved'}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              style={{
                background: 'rgba(129,140,248,0.12)',
                border: '1px solid rgba(129,140,248,0.2)',
              }}
            >
              <span className="text-xl">{timelineIcon}</span>
              <span className="text-xs text-white/70 leading-tight text-center">{timelineLabel}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.3))',
                border: '1px solid rgba(129,140,248,0.35)',
              }}
            >
              <span className="text-xl">✦</span>
              <span className="text-xs text-white/70">Share</span>
            </button>
          </div>

          {/* Anonymous hint */}
          {!isLoggedIn && (
            <p className="text-xs text-center text-white/30 pb-1">
              Sign in to save and download your card
            </p>
          )}
        </div>
      </div>

      {/* Auth modal (shown when anonymous user taps Download or Add to My Starry) */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false)
            onAuthSuccess?.()
          }}
        />
      )}
    </>
  )
}
