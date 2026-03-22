/**
 * components/TimelineView.tsx
 *
 * Client component that renders the full-screen timeline of saved nodes.
 *
 * Behaviour:
 *  - 0 nodes: empty state with CTA to /explore
 *  - 1 node: single full-screen card (no scrolling UI)
 *  - 2+ nodes: CSS scroll-snap vertical scroll container — each card is 100dvh,
 *    snap-start, giving the "one card per swipe" feel
 *
 * IntersectionObserver tracks which card is active and exposes an index indicator.
 * It also controls lazy loading: only the active card ±1 have `shouldLoad=true`.
 *
 * Sharing: tapping the Share button on any card builds CardOptions from the node
 * and opens the existing ShareModal.
 *
 * Fixed overlays (header + "+" button) sit above the scroll container via
 * position:fixed with a high z-index so they persist across card scrolls.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import TimelineCard, { type TimelineNode } from './TimelineCard'
import type { CardOptions } from '@/lib/canvas'

// How long (ms) before the tagline overlay fades out automatically
const TAGLINE_FADE_MS = 3500

// Dynamic import — ShareModal is only needed on interaction
const ShareModal = dynamic(() => import('./ShareModal'), { ssr: false })

interface TimelineViewProps {
  nodes: TimelineNode[]
}

export default function TimelineView({ nodes }: TimelineViewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [shareNode, setShareNode] = useState<TimelineNode | null>(null)
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0, 1]))
  const [showTagline, setShowTagline] = useState(true)
  const [taglineFading, setTaglineFading] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const taglineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-fade tagline after TAGLINE_FADE_MS
  useEffect(() => {
    if (nodes.length === 0) return
    taglineTimerRef.current = setTimeout(() => {
      setTaglineFading(true)
      setTimeout(() => setShowTagline(false), 800)
    }, TAGLINE_FADE_MS)
    return () => {
      if (taglineTimerRef.current) clearTimeout(taglineTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IntersectionObserver: detect which card is visible
  useEffect(() => {
    if (nodes.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'))
            if (!isNaN(idx)) {
              setActiveIndex(idx)
              // Hide tagline + scroll hint once user scrolls past first card
              if (idx > 0) {
                if (taglineTimerRef.current) clearTimeout(taglineTimerRef.current)
                setShowTagline(false)
              }
              // Load current card ±1
              setLoadedIndices((prev) => {
                const next = new Set(prev)
                next.add(idx)
                if (idx > 0) next.add(idx - 1)
                if (idx < nodes.length - 1) next.add(idx + 1)
                return next
              })
            }
          }
        }
      },
      { threshold: 0.5 }
    )

    cardRefs.current.forEach((ref) => {
      if (ref) observerRef.current!.observe(ref)
    })

    return () => observerRef.current?.disconnect()
  }, [nodes.length])

  const handleShare = useCallback((node: TimelineNode) => {
    setShareNode(node)
  }, [])

  const cardOptions: CardOptions | null = shareNode
    ? {
        imageUrl: `/api/apod/image/${shareNode.resolved_apod_date}`,
        note: shareNode.note ?? '',
        apodTitle: shareNode.apod_title ?? '',
        copyright: shareNode.apod_copyright ?? undefined,
        date: shareNode.event_date,
      }
    : null

  // --- Empty state ---
  if (nodes.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#030712' }}
      >
        {/* Fixed header */}
        <header
          className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 pt-8 pb-4 z-50"
          style={{ background: 'linear-gradient(to bottom, rgba(3,7,18,0.95), transparent)' }}
        >
          <Link href="/" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ← Home
          </Link>
          <span className="font-cinzel text-lg tracking-widest" style={{ color: '#818cf8' }}>
            ✦ STARRY
          </span>
          <div className="w-16" />
        </header>

        <p className="text-5xl mb-6">✦</p>
        <h2 className="font-cinzel text-xl text-white mb-3">Your universe is empty</h2>
        <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Add important dates to see what the cosmos looked like on your most meaningful moments.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            boxShadow: '0 0 28px rgba(99,102,241,0.3)',
          }}
        >
          Explore a date
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Fixed header — persists across all cards */}
      <header
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 pt-8 pb-4 z-50"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
      >
        <Link
          href="/"
          className="text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          ← Home
        </Link>
        <span className="font-cinzel text-sm tracking-widest" style={{ color: '#818cf8' }}>
          ✦ STARRY
        </span>
        <div className="w-16" />
      </header>

      {/* Scroll container */}
      <div
        className="overflow-y-scroll snap-y snap-mandatory"
        style={{ height: '100dvh' }}
      >
        {nodes.map((node, i) => (
          <div
            key={node.id}
            ref={(el) => { cardRefs.current[i] = el }}
            data-index={i}
            className="snap-start relative"
            style={{ height: '100dvh' }}
          >
            <TimelineCard
              node={node}
              shouldLoad={loadedIndices.has(i)}
              onShare={handleShare}
            />

            {/* Tagline overlay — first card only */}
            {i === 0 && showTagline && (
              <div
                className="absolute inset-0 pointer-events-none flex items-start justify-center z-20"
                style={{
                  paddingTop: '30%',
                  opacity: taglineFading ? 0 : 1,
                  transition: 'opacity 0.8s ease',
                }}
              >
                <p
                  className="font-cinzel text-center text-white px-6 leading-relaxed"
                  style={{
                    fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                    textShadow: '0 2px 20px rgba(0,0,0,0.9)',
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '1rem',
                    padding: '1rem 1.5rem',
                    maxWidth: '80%',
                  }}
                >
                  Your important days form a unique universe
                </p>
              </div>
            )}

            {/* Scroll hint — first card, only when there are multiple nodes */}
            {i === 0 && nodes.length > 1 && activeIndex === 0 && (
              <div
                className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20 pointer-events-none"
                style={{
                  opacity: showTagline || activeIndex === 0 ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              >
                <span className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Scroll
                </span>
                <svg
                  className="animate-bounce-down"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  <path
                    d="M10 4v12M10 16l-4-4M10 16l4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress dots — right side */}
      {nodes.length > 1 && (
        <div
          className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50"
        >
          {nodes.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '6px' : '4px',
                height: i === activeIndex ? '18px' : '4px',
                background: i === activeIndex ? '#818cf8' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}

      {/* Floating "+" button — add a new date */}
      <Link
        href="/explore"
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium z-50 transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(10,10,30,0.75)',
          border: '1px solid rgba(129,140,248,0.35)',
          color: '#a5b4fc',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <span className="text-lg leading-none">+</span>
        <span>Add a date</span>
      </Link>

      {/* Share modal */}
      {shareNode && cardOptions && (
        <ShareModal
          options={cardOptions}
          isLoggedIn={true}
          onClose={() => setShareNode(null)}
        />
      )}
    </>
  )
}
