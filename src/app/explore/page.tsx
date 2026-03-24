/**
 * app/explore/page.tsx
 *
 * The core "60-second hook" experience — client component.
 *
 * Flow:
 *  1. Date input → submit
 *     a. Date ≥ 1995-06-16 → fetch APOD metadata → photo step
 *     b. Date < 1995-06-16 → curated gallery (pre-APOD fallback)
 *  2. Display photo + title
 *  3. Keyword picker (suggestions derived from title + explanation)
 *  4. Note input ("The day I was born")
 *  5. "Preview my card" → card preview
 *  6. Share modal → Download / Add to My Starry / Web Share
 *
 * All users are authenticated before reaching this page (auth-first).
 * No auth gating or draft persistence needed here.
 *
 * Analytics events: page_view, date_entered, photo_loaded, card_generated,
 * card_downloaded, caption_copied, card_shared.
 */

'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import StarryBackground from '@/components/StarryBackground'
import DateInput from '@/components/DateInput'
import PhotoDisplay from '@/components/PhotoDisplay'
import KeywordPicker from '@/components/KeywordPicker'
import CuratedGallery from '@/components/CuratedGallery'
import { suggestKeywords } from '@/lib/keywords'
import MeteorInput from '@/components/MeteorInput'
import { trackEvent } from '@/lib/analytics'
import { canvasToBlob } from '@/lib/canvas'
import { saveNode } from '@/lib/nodes'
import type { CardOptions } from '@/lib/canvas'
import type { Draft } from '@/lib/draft'

// Dynamic import — only loaded when user opens share modal
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false })

interface ApodData {
  date: string
  resolvedDate: string
  title: string
  explanation: string
  copyright?: string
}

type Step = 'input' | 'loading' | 'curated' | 'photo' | 'card'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function ExplorePageInner() {
  const searchParams = useSearchParams()
  const defaultDate = searchParams.get('date') ?? ''

  const [step, setStep] = useState<Step>('input')
  const [preApodDate, setPreApodDate] = useState<string | null>(null)
  const [apod, setApod] = useState<ApodData | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [note, setNote] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [showMeteorInput, setShowMeteorInput] = useState(false)

  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Track page view on mount
  useEffect(() => {
    trackEvent('page_view', { page: 'explore' })
  }, [])

  function fetchApod(
    date: string,
    resolvedDate?: string,
    title?: string,
    copyright?: string
  ) {
    if (resolvedDate && title) {
      setApod({ date, resolvedDate, title, explanation: '', copyright })
      setSuggestions(suggestKeywords(title, ''))
      setStep('photo')
      return
    }

    setStep('loading')
    setError(null)

    fetch(`/api/apod/${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          setStep('input')
          return
        }
        const apodData: ApodData = {
          date: data.date,
          resolvedDate: data.resolvedDate,
          title: data.title,
          explanation: data.explanation,
          copyright: data.copyright,
        }
        setApod(apodData)
        setSuggestions(suggestKeywords(data.title, data.explanation))
        setStep('photo')
      })
      .catch(() => {
        setError('Could not reach the cosmos. Please try again.')
        setStep('input')
      })
  }

  function handleDateSubmit(date: string) {
    trackEvent('date_entered', { date })
    fetchApod(date)
  }

  /** Called when user enters a pre-1995 date — show curated gallery */
  function handlePreApodDate(date: string) {
    setPreApodDate(date)
    setStep('curated')
    trackEvent('date_entered', { date, curated: true })
  }

  /** Called when user picks a photo from the curated gallery */
  function handleCuratedPick(apodDate: string, title: string, credit: string) {
    const userDate = preApodDate ?? apodDate
    setApod({
      date: userDate,
      resolvedDate: apodDate,
      title,
      explanation: '',
      copyright: credit,
    })
    setSuggestions(suggestKeywords(title, ''))
    setStep('photo')
  }

  function buildNodeData(): Draft | null {
    if (!apod) return null
    return {
      date: apod.date,
      resolvedDate: apod.resolvedDate,
      note,
      displayName,
      keywords,
      apodTitle: apod.title,
      apodCopyright: apod.copyright,
    }
  }

  async function handleSaveToTimeline() {
    if (!apod || !cardCanvasRef.current) return
    const nodeData = buildNodeData()
    if (!nodeData) return
    setSaveState('saving')
    const blob = await canvasToBlob(cardCanvasRef.current)
    await saveNode(nodeData, blob)
    setSaveState('saved')
  }

  const cardOptions: CardOptions | null = apod
    ? {
        imageUrl: `/api/apod/image/${apod.resolvedDate}`,
        note,
        displayName,
        apodTitle: apod.title,
        copyright: apod.copyright,
        date: apod.date,
      }
    : null

  return (
    <main className="relative min-h-screen flex flex-col" style={{ background: '#030712' }}>
      <StarryBackground />
      {/* Header */}
      <header className="relative z-[1] flex items-center justify-between px-6 pt-8 pb-4 shrink-0">
        <Link
          href="/"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Home
        </Link>
        <span
          className="font-cinzel text-lg tracking-widest"
          style={{ color: '#818cf8' }}
        >
          ✦ STARRY
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/meteors"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Wishes
          </Link>
          <Link
            href="/profile"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            My Starry
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-[1] flex-1 flex flex-col items-center px-6 pb-12">

        {/* Save state banner */}
        {saveState === 'saved' && (
          <div
            className="w-full max-w-sm mt-4 px-4 py-3 rounded-xl text-sm text-center flex flex-col gap-1.5"
            style={{
              background: 'rgba(129,140,248,0.15)',
              border: '1px solid rgba(129,140,248,0.3)',
              color: '#a5b4fc',
            }}
          >
            <span>✦ Saved to My Starry</span>
            <Link
              href="/profile"
              className="text-xs underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: '#c7d2fe' }}
            >
              View in My Starry →
            </Link>
            <button
              onClick={() => setShowMeteorInput(true)}
              className="text-xs underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: '#a5b4fc' }}
            >
              Send a meteor wish ✦
            </button>
          </div>
        )}
        {saveState === 'error' && (
          <p className="w-full max-w-sm mt-4 text-sm text-red-400 text-center">
            Save failed — please try again.
          </p>
        )}
        {saveState === 'saving' && (
          <p className="w-full max-w-sm mt-4 text-sm text-white/40 text-center">
            Saving your moment…
          </p>
        )}

        {/* Step: Input */}
        {(step === 'input' || step === 'loading') && (
          <div className="w-full max-w-sm flex flex-col items-center gap-8 pt-16">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-light text-white">
                Enter your important date
              </h1>
              <p className="text-sm text-white/45">
                Birthday, anniversary, first day — any date that matters.
              </p>
            </div>

            <DateInput
              onSubmit={handleDateSubmit}
              onPreApod={handlePreApodDate}
              isLoading={step === 'loading'}
              defaultDate={defaultDate}
            />

            {error && (
              <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
            )}
          </div>
        )}

        {/* Step: Curated gallery (pre-1995 dates) */}
        {step === 'curated' && (
          <div className="w-full max-w-sm pt-8">
            <CuratedGallery
              onPick={handleCuratedPick}
              onBack={() => setStep('input')}
            />
          </div>
        )}

        {/* Step: Photo + keywords + note */}
        {step === 'photo' && apod && (
          <div className="w-full max-w-sm flex flex-col gap-6 pt-8">
            {/* Back button */}
            <button
              onClick={() => setStep(preApodDate ? 'curated' : 'input')}
              className="self-start text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              ← {preApodDate ? 'Back to gallery' : 'Change date'}
            </button>

            {/* APOD photo */}
            <PhotoDisplay
              resolvedDate={apod.resolvedDate}
              title={apod.title}
              copyright={apod.copyright}
              date={apod.date}
            />

            {/* Name input */}
            <div className="space-y-2">
              <label className="block text-sm text-white/60 tracking-wide">
                What name would you like on your card?
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 15))}
                placeholder="e.g. Eric, Luna, Mom…"
                maxLength={15}
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              <p className="text-right text-xs text-white/25">{displayName.length}/15</p>
            </div>

            {/* Keyword picker */}
            <KeywordPicker
              suggestions={suggestions}
              selected={keywords}
              onChange={setKeywords}
            />

            {/* Note input */}
            <div className="space-y-2">
              <label className="block text-sm text-white/60 tracking-wide">
                What is this day to you?
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="The day I was born…"
                maxLength={120}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none resize-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              <p className="text-right text-xs text-white/25">{note.length}/120</p>
            </div>

            {/* Preview card CTA */}
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full py-4 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                boxShadow: '0 0 32px rgba(99,102,241,0.3)',
              }}
            >
              Preview my card ✦
            </button>
          </div>
        )}
      </div>

      {/* Share modal (dynamically loaded) */}
      {showShareModal && cardOptions && (
        <ShareModal
          options={cardOptions}
          onClose={() => setShowShareModal(false)}
          onCardReady={(canvas) => { cardCanvasRef.current = canvas }}
          onSaveToTimeline={handleSaveToTimeline}
        />
      )}

      {/* Meteor wish composer */}
      {showMeteorInput && (
        <MeteorInput
          displayName={displayName}
          eventDate={apod?.resolvedDate}
          onClose={() => setShowMeteorInput(false)}
          onSuccess={() => setShowMeteorInput(false)}
        />
      )}
    </main>
  )
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageInner />
    </Suspense>
  )
}
