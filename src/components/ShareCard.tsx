/**
 * components/ShareCard.tsx
 *
 * React wrapper around the Canvas-based card generation.
 * Renders a preview <canvas> element inside a styled container.
 * Used in the explore flow to show users their card before they commit to downloading.
 *
 * Props expose the canvas ref so the parent (ShareModal) can call
 * canvas.toBlob() directly for download/upload without re-rendering.
 *
 * Image loads via /api/apod/image/[resolvedDate] (same-origin — no canvas taint).
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { generateCard, disposeCanvas, type CardOptions } from '@/lib/canvas'
import { trackEvent } from '@/lib/analytics'

interface ShareCardProps {
  options: CardOptions
  /** Called with the live canvas element once rendered — parent uses for export */
  onReady?: (canvas: HTMLCanvasElement) => void
}

export default function ShareCard({ options, onReady }: ShareCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    setStatus('loading')
    let currentCanvas: HTMLCanvasElement | null = null

    generateCard(options)
      .then((canvas) => {
        const container = containerRef.current
        if (!container) return

        // Dispose and remove any previous canvas to free GPU memory
        const prev = container.firstChild as HTMLCanvasElement | null
        if (prev) {
          disposeCanvas(prev)
          container.removeChild(prev)
        }

        currentCanvas = canvas
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        container.appendChild(canvas)
        setStatus('done')
        onReady?.(canvas)
        trackEvent('card_generated', { date: options.date })
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Card generation failed')
        setStatus('error')
      })

    // Dispose canvas when the effect re-runs or the component unmounts
    return () => {
      if (currentCanvas) {
        disposeCanvas(currentCanvas)
        currentCanvas = null
      }
    }
  // Re-run only when content-affecting props change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.imageUrl, options.note, options.apodTitle, options.copyright, options.date])

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden"
      style={{ aspectRatio: '4 / 5' }}
    >
      {/* Placeholder while loading */}
      {status === 'loading' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0d0d2e, #1a1a3e)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{
                border: '2px solid rgba(129,140,248,0.2)',
                borderTopColor: '#818cf8',
              }}
            />
            <p className="text-xs text-white/40">Generating your card…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{ background: '#0d0d2e' }}
        >
          <p className="text-xs text-red-400 text-center">{errorMsg}</p>
        </div>
      )}

      {/* Canvas is mounted here by the useEffect */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
