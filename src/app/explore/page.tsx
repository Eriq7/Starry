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
 *  6. Share modal → Download (gated for anonymous) / Copy Caption / Web Share
 *
 * Draft is written to localStorage on every note/keyword change.
 * If auth_return=1 is in the URL, we restore the draft and auto-trigger
 * save + download once the card canvas is ready and the user is logged in.
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
import { saveDraft, loadDraft, clearDraft } from '@/lib/draft'
import { trackEvent } from '@/lib/analytics'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { downloadCard, canvasToBlob } from '@/lib/canvas'
import { saveNode } from '@/lib/nodes'
import type { CardOptions } from '@/lib/canvas'

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
  const authReturn = searchParams.get('auth_return') === '1'
  const authErrorParam = searchParams.get('auth_error') === '1'

  const [step, setStep] = useState<Step>('input')
  const [preApodDate, setPreApodDate] = useState<string | null>(null)
  const [apod, setApod] = useState<ApodData | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [note, setNote] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // Refs for the auto-save-and-download flow after Magic Link return
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const pendingDownloadRef = useRef(false)

  // Track page view on mount
  useEffect(() => {
    trackEvent('page_view', { page: 'explore' })
  }, [])

  // Check auth status and watch for state changes
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user
      setIsLoggedIn(loggedIn)
      if (loggedIn && pendingDownloadRef.current && cardCanvasRef.current) {
        pendingDownloadRef.current = false
        triggerSaveAndDownload(cardCanvasRef.current)
      }
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle auth_return: restore draft, set pending download, open modal
  useEffect(() => {
    if (!authReturn) return
    const draft = loadDraft()
    if (!draft) return

    pendingDownloadRef.current = true
    setDisplayName(draft.displayName ?? '')
    setNote(draft.note)
    setKeywords(draft.keywords)
    fetchApod(draft.date, draft.resolvedDate, draft.apodTitle, draft.apodCopyright)
    setTimeout(() => setShowShareModal(true), 800)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReturn])

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

  // Persist draft to localStorage whenever note/keywords/displayName change
  useEffect(() => {
    if (!apod) return
    saveDraft({
      date: apod.date,
      resolvedDate: apod.resolvedDate,
      note,
      displayName,
      keywords,
      apodTitle: apod.title,
      apodCopyright: apod.copyright,
    })
  }, [note, displayName, keywords, apod])

  function handleCardReady(canvas: HTMLCanvasElement) {
    cardCanvasRef.current = canvas
    if (pendingDownloadRef.current && isLoggedIn) {
      pendingDownloadRef.current = false
      triggerSaveAndDownload(canvas)
    }
  }

  async function triggerSaveAndDownload(canvas: HTMLCanvasElement) {
    if (!apod) return
    const draft = loadDraft()
    if (!draft) return

    setSaveState('saving')
    try {
      const blob = await canvasToBlob(canvas)
      await saveNode(draft, blob)
      await downloadCard(canvas, `starry-${apod.date}.png`)
      trackEvent('card_downloaded', { date: apod.date })
      clearDraft()
      setSaveState('saved')
    } catch (err) {
      console.error('[explore] save+download failed:', err)
      setSaveState('error')
    }
  }

  async function handleAuthSuccess() {
    setIsLoggedIn(true)
    if (cardCanvasRef.current && apod) {
      await triggerSaveAndDownload(cardCanvasRef.current)
    }
  }

  async function handleSaveToTimeline() {
    if (!apod || !cardCanvasRef.current) return
    const draft = loadDraft()
    if (!draft) return
    setSaveState('saving')
    const blob = await canvasToBlob(cardCanvasRef.current)
    await saveNode(draft, blob)
    clearDraft()
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
        {isLoggedIn ? (
          <Link
            href="/profile"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            My Starry
          </Link>
        ) : (
          <div className="w-16" />
        )}
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

        {/* Auth error */}
        {authErrorParam && (
          <p className="w-full max-w-sm mt-4 text-sm text-red-400 text-center">
            Sign-in link expired. Please try again.
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
          isLoggedIn={isLoggedIn}
          onClose={() => setShowShareModal(false)}
          onAuthSuccess={handleAuthSuccess}
          onCardReady={handleCardReady}
          onSaveToTimeline={handleSaveToTimeline}
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
