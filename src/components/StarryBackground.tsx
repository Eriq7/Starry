/**
 * components/StarryBackground.tsx
 *
 * Canvas-based animated starry sky background for the explore page.
 * Renders ~120 slowly twinkling stars, occasional shooting stars
 * (head at lower-left, fading tail upper-right — matching the download card style),
 * and subtle nebula radial gradients for depth.
 *
 * Position: fixed, behind all page content (z-index: 0).
 * Uses requestAnimationFrame and pauses when the tab is hidden.
 */

'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  baseOpacity: number
  opacity: number
  phase: number      // offset into the twinkle sine wave
  speed: number      // twinkle frequency
}

interface Shooter {
  // tail (upper-right) → head (lower-left)
  x1: number; y1: number
  x2: number; y2: number
  progress: number   // 0→1 animation progress
  speed: number
  width: number
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let stars: Star[] = []
    let shooters: Shooter[] = []
    let nextShooterAt = 0  // timestamp when to spawn next group

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      buildStars()
    }

    function buildStars() {
      if (!canvas) return
      const count = Math.round((canvas.width * canvas.height) / 8000)
      stars = Array.from({ length: Math.max(80, Math.min(count, 160)) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        baseOpacity: Math.random() * 0.35 + 0.1,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.2,
      }))
    }

    function spawnShooterGroup() {
      if (!canvas) return
      // Spawn 3 shooters at once, each at a distinct random position
      for (let i = 0; i < 3; i++) {
        const startX = canvas.width * (0.1 + Math.random() * 0.85)
        const startY = canvas.height * (Math.random() * 0.5)
        const len = 80 + Math.random() * 120
        const angle = Math.PI * (0.55 + Math.random() * 0.2)  // ~100–115° from +x axis
        shooters.push({
          x1: startX,
          y1: startY,
          x2: startX + Math.cos(angle) * len,
          y2: startY + Math.sin(angle) * len,
          progress: 0,
          speed: 0.012 + Math.random() * 0.01,
          width: 1.2 + Math.random() * 1.2,
        })
      }
    }

    function drawNebula() {
      if (!canvas || !ctx) return
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

    function loop(ts: number) {
      if (!canvas || !ctx) return
      if (document.hidden) {
        animId = requestAnimationFrame(loop)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawNebula()

      // Stars with twinkle
      const t = ts / 1000
      for (const s of stars) {
        s.opacity = s.baseOpacity * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase))
        ctx.save()
        ctx.globalAlpha = s.opacity
        ctx.fillStyle = '#e0e7ff'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Shooting star groups — spawn 3 at once, then wait before next group
      if (shooters.length === 0 && ts >= nextShooterAt) {
        spawnShooterGroup()
        nextShooterAt = ts + 3000 + Math.random() * 3000
      }
      shooters = shooters.filter((s) => s.progress < 1)
      for (const sh of shooters) {
        sh.progress = Math.min(1, sh.progress + sh.speed)
        const p = sh.progress

        const cx = sh.x1 + (sh.x2 - sh.x1) * p
        const cy = sh.y1 + (sh.y2 - sh.y1) * p

        const grad = ctx.createLinearGradient(cx, cy, sh.x1, sh.y1)
        grad.addColorStop(0,   'rgba(255,255,255,0.75)')
        grad.addColorStop(0.3, 'rgba(200,210,255,0.4)')
        grad.addColorStop(1,   'rgba(255,255,255,0)')

        ctx.save()
        ctx.strokeStyle = grad
        ctx.lineWidth = sh.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(sh.x1, sh.y1)
        ctx.lineTo(cx, cy)
        ctx.stroke()

        ctx.globalAlpha = 0.8 * (1 - Math.abs(p - 0.5) * 1.5)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(cx, cy, sh.width, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
