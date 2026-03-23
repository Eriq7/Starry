/**
 * components/MeteorShower.tsx
 *
 * Interactive meteor shower for the /meteors page.
 * Hybrid architecture: canvas for background/meteor trails + DOM overlay for
 * clickable glowing dots and expandable message cards.
 *
 * Lifecycle:
 *  1. Flying   — canvas meteor streak animates across screen (~1.5–2s)
 *  2. Landing  — trail fades, DOM dot appears at endpoint (x2, y2)
 *  3. Resting  — dot pulses with CSS animation, clickable
 *  4. Expanded — click opens message card, click outside collapses
 *
 * Data: fetches GET /api/meteors?limit=30 on mount. Launches one meteor every
 * 2–3 seconds until all messages have landed.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface MeteorMessage {
  id: string
  displayName: string
  message: string
  category: 'wish' | 'reflection' | 'warmth'
  createdAt: string
}

interface LandedDot {
  id: string
  x: number
  y: number
  message: MeteorMessage
}

interface FlyingMeteor {
  id: string
  x1: number; y1: number
  x2: number; y2: number
  progress: number
  speed: number
  width: number
  message: MeteorMessage
}

interface Star {
  x: number; y: number; r: number
  baseOpacity: number; opacity: number
  phase: number; speed: number
}

const CATEGORY_ICON: Record<string, string> = {
  wish: '✦',
  reflection: '☽',
  warmth: '♡',
}

const CATEGORY_LABEL: Record<string, string> = {
  wish: 'A wish for the future',
  reflection: 'A reflection on life',
  warmth: 'Warmth to a stranger',
}

interface MeteorShowerProps {
  messages: MeteorMessage[]
  /** Newly submitted meteor — inserted immediately at the front of the queue */
  newMeteor?: MeteorMessage
}

export default function MeteorShower({ messages, newMeteor }: MeteorShowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [landedDots, setLandedDots] = useState<LandedDot[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const flyingRef = useRef<FlyingMeteor[]>([])
  const starsRef = useRef<Star[]>([])
  const animIdRef = useRef<number>(0)
  const messageQueueRef = useRef<MeteorMessage[]>([])
  const lastLaunchRef = useRef<number>(0)
  const launchIntervalRef = useRef<number>(2200)
  /** Set of ids that have been queued, flying, or landed — prevents duplicates */
  const processedIdsRef = useRef<Set<string>>(new Set())
  /** True once the initial message queue has been populated */
  const initializedRef = useRef(false)

  // Build endpoint for meteor (endpoint is lower-left of canvas)
  function buildMeteor(msg: MeteorMessage, canvas: HTMLCanvasElement): FlyingMeteor {
    const w = canvas.width
    const h = canvas.height
    // Start upper-right area
    const startX = w * (0.35 + Math.random() * 0.6)
    const startY = h * (Math.random() * 0.45)
    const len = 100 + Math.random() * 150
    const angle = Math.PI * (0.55 + Math.random() * 0.18) // ~100-113° lower-left
    return {
      id: msg.id,
      x1: startX,
      y1: startY,
      x2: startX + Math.cos(angle) * len,
      y2: startY + Math.sin(angle) * len,
      progress: 0,
      speed: 0.008 + Math.random() * 0.006,
      width: 1.5 + Math.random() * 1.2,
      message: msg,
    }
  }

  function buildStars(canvas: HTMLCanvasElement): Star[] {
    const count = Math.round((canvas.width * canvas.height) / 8000)
    return Array.from({ length: Math.max(80, Math.min(count, 160)) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      baseOpacity: Math.random() * 0.35 + 0.1,
      opacity: 0,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.4 + 0.2,
    }))
  }

  function drawNebula(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const regions = [
      { x: canvas.width * 0.15, y: canvas.height * 0.25, rx: 220, ry: 160, color: '67,56,202' },
      { x: canvas.width * 0.78, y: canvas.height * 0.6,  rx: 180, ry: 130, color: '109,40,217' },
      { x: canvas.width * 0.5,  y: canvas.height * 0.85, rx: 260, ry: 120, color: '30,58,138' },
    ]
    for (const r of regions) {
      const g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, Math.max(r.rx, r.ry))
      g.addColorStop(0,   `rgba(${r.color},0.06)`)
      g.addColorStop(0.5, `rgba(${r.color},0.03)`)
      g.addColorStop(1,   `rgba(${r.color},0)`)
      ctx.save()
      ctx.scale(r.rx / Math.max(r.rx, r.ry), r.ry / Math.max(r.rx, r.ry))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(
        r.x / (r.rx / Math.max(r.rx, r.ry)),
        r.y / (r.ry / Math.max(r.rx, r.ry)),
        Math.max(r.rx, r.ry), 0, Math.PI * 2
      )
      ctx.fill()
      ctx.restore()
    }
  }

  const handleDotClick = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  // Initialize the queue once, when we receive the first non-empty messages list.
  // Never replace the queue after that — prevents already-landed meteors from re-flying.
  useEffect(() => {
    if (initializedRef.current || messages.length === 0) return
    initializedRef.current = true
    const fresh = messages.filter((m) => !processedIdsRef.current.has(m.id))
    messageQueueRef.current = [...fresh]
    fresh.forEach((m) => processedIdsRef.current.add(m.id))
  }, [messages])

  // When a brand-new meteor arrives, launch it immediately (skip the queue)
  useEffect(() => {
    if (!newMeteor) return
    if (processedIdsRef.current.has(newMeteor.id)) return
    processedIdsRef.current.add(newMeteor.id)
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0) return
    flyingRef.current.unshift(buildMeteor(newMeteor, canvas))
  // buildMeteor is a stable function defined in component scope — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMeteor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      starsRef.current = buildStars(canvas)
    }

    function loop(ts: number) {
      if (!canvas || !ctx) return
      if (document.hidden) {
        animIdRef.current = requestAnimationFrame(loop)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawNebula(ctx, canvas)

      // Twinkling stars
      const t = ts / 1000
      for (const s of starsRef.current) {
        s.opacity = s.baseOpacity * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase))
        ctx.save()
        ctx.globalAlpha = s.opacity
        ctx.fillStyle = '#e0e7ff'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Launch next meteor from queue
      if (
        messageQueueRef.current.length > 0 &&
        ts - lastLaunchRef.current > launchIntervalRef.current
      ) {
        const msg = messageQueueRef.current.shift()!
        flyingRef.current.push(buildMeteor(msg, canvas))
        lastLaunchRef.current = ts
        launchIntervalRef.current = 2000 + Math.random() * 1200
      }

      // Animate flying meteors
      const completed: FlyingMeteor[] = []
      flyingRef.current = flyingRef.current.filter((sh) => {
        sh.progress = Math.min(1, sh.progress + sh.speed)
        const p = sh.progress

        // Draw trail
        const cx = sh.x1 + (sh.x2 - sh.x1) * p
        const cy = sh.y1 + (sh.y2 - sh.y1) * p

        const grad = ctx.createLinearGradient(sh.x2, sh.y2, sh.x1, sh.y1)
        grad.addColorStop(0,   'rgba(255,255,255,0)')
        grad.addColorStop(0.6, 'rgba(200,210,255,0.35)')
        grad.addColorStop(1,   'rgba(255,255,255,0.75)')

        ctx.save()
        ctx.strokeStyle = grad
        ctx.lineWidth = sh.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(sh.x1, sh.y1)
        ctx.lineTo(cx, cy)
        ctx.stroke()

        // Bright head at current position
        ctx.globalAlpha = 0.9 * (1 - Math.abs(p - 0.5) * 1.5)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.beginPath()
        ctx.arc(cx, cy, sh.width + 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        if (p >= 1) {
          completed.push(sh)
          return false
        }
        return true
      })

      // Convert completed meteors to landed DOM dots
      if (completed.length > 0) {
        setLandedDots((prev) => [
          ...prev,
          ...completed.map((sh) => ({
            id: sh.id,
            x: sh.x2,
            y: sh.y2,
            message: sh.message,
          })),
        ])
      }

      animIdRef.current = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    animIdRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="fixed inset-0" style={{ background: '#030712' }}>
      {/* Canvas layer — background + meteor trails */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      />

      {/* DOM overlay — interactive dots + message cards */}
      <div className="absolute inset-0" style={{ zIndex: 1, pointerEvents: 'none' }}>
        {landedDots.map((dot) => {
          const isExpanded = expandedId === dot.id
          // Clamp card position to viewport
          const cardX = Math.min(Math.max(dot.x - 120, 12), (typeof window !== 'undefined' ? window.innerWidth : 400) - 252)
          const cardY = dot.y + 20

          return (
            <div key={dot.id}>
              {/* Glowing pulse dot */}
              <button
                onClick={() => handleDotClick(dot.id)}
                aria-label={`Read wish from ${dot.message.displayName}`}
                style={{
                  position: 'absolute',
                  left: dot.x - 6,
                  top: dot.y - 6,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'rgba(165,180,252,0.9)',
                  boxShadow: isExpanded
                    ? '0 0 16px 6px rgba(129,140,248,0.8)'
                    : '0 0 8px 3px rgba(129,140,248,0.5)',
                  animation: 'meteor-pulse 2s ease-in-out infinite',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  border: 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />

              {/* Expanded message card */}
              {isExpanded && (
                <div
                  style={{
                    position: 'absolute',
                    left: cardX,
                    top: Math.min(cardY, (typeof window !== 'undefined' ? window.innerHeight : 600) - 160),
                    width: 240,
                    pointerEvents: 'auto',
                    zIndex: 10,
                    background: 'linear-gradient(160deg, #0f0f2e 0%, #030712 100%)',
                    border: '1px solid rgba(129,140,248,0.3)',
                    borderRadius: 16,
                    padding: '12px 14px',
                    boxShadow: '0 0 32px rgba(99,102,241,0.25)',
                    animation: 'card-appear 0.2s ease-out',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#a5b4fc' }}>
                      {CATEGORY_ICON[dot.message.category]}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(165,180,252,0.7)', letterSpacing: '0.05em' }}>
                      {CATEGORY_LABEL[dot.message.category]}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5, marginBottom: 8 }}>
                    {dot.message.message}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
                    — {dot.message.displayName}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Close expanded card when clicking outside */}
      {expandedId && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 2, pointerEvents: 'auto' }}
          onClick={() => setExpandedId(null)}
        />
      )}

      <style>{`
        @keyframes meteor-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%       { transform: scale(1.5); opacity: 0.6; }
        }
        @keyframes card-appear {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
