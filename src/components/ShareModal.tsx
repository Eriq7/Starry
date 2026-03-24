/**
 * components/ShareModal.tsx
 *
 * Share modal — appears after the user previews their card.
 * Three actions:
 *  1. Download image (saves card PNG locally)
 *  2. Add to My Starry (saves card to timeline DB)
 *  3. Web Share API (system share sheet on mobile; download fallback on desktop)
 *
 * All users are authenticated by the time they reach this modal (auth-first).
 */

'use client'

import { useRef, useState } from 'react'
import ShareCard from './ShareCard'
import MeteorInput from './MeteorInput'
import { downloadCard, canvasToBlob, type CardOptions } from '@/lib/canvas'
import { trackEvent } from '@/lib/analytics'

interface ShareModalProps {
  options: CardOptions
  onClose: () => void
  /** Called with the canvas element once the card has been rendered */
  onCardReady?: (canvas: HTMLCanvasElement) => void
  /** Called when user clicks "Add to My Starry" */
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
  onClose,
  onCardReady,
  onSaveToTimeline,
}: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showMeteorInput, setShowMeteorInput] = useState(false)
  const [timelineSaveState, setTimelineSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const caption = buildCaption(options.note, options.apodTitle)
  const filename = `starry-${options.date}.png`

  async function handleDownload() {
    if (!canvasRef.current) return
    await downloadCard(canvasRef.current, filename)
    trackEvent('card_downloaded', { date: options.date })
  }

  async function handleAddToTimeline() {
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
    timelineSaveState === 'error'  ? 'Error' : 'Add to My Starry'

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
              <span className="text-xs text-white/70">Save</span>
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

          {/* Meteor wish CTA */}
          <button
            onClick={() => setShowMeteorInput(true)}
            className="w-full py-2.5 rounded-xl text-sm transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.2)',
              color: 'rgba(199,210,254,0.8)',
            }}
          >
            Send a meteor wish ✦
          </button>
        </div>
      </div>

      {/* Meteor wish composer */}
      {showMeteorInput && (
        <MeteorInput
          displayName={options.displayName ?? ''}
          eventDate={options.date}
          onClose={() => setShowMeteorInput(false)}
          onSuccess={() => setShowMeteorInput(false)}
        />
      )}
    </>
  )
}
