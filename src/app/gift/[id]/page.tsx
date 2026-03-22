/**
 * app/gift/[id]/page.tsx
 *
 * Gift landing page — server-rendered with OG metadata.
 *
 * Fetches the gift from the DB (public read RLS on the gifts table).
 * Generates OG meta tags so the blurred APOD photo + recipient name
 * appear correctly on Twitter, WhatsApp, iMessage, etc.
 *
 * Renders the <GiftReveal> client component for the blur-to-reveal experience.
 * On first view (viewed_at IS NULL), isFirstView=true is passed to GiftReveal
 * which fires a PATCH to update the timestamp.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import GiftReveal from './GiftReveal'

interface GiftPageProps {
  params: Promise<{ id: string }>
}

interface Gift {
  id: string
  recipient_name: string
  event_date: string
  resolved_apod_date: string
  apod_title: string | null
  apod_copyright: string | null
  message: string | null
  viewed_at: string | null
}

async function getGift(id: string): Promise<Gift | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('gifts')
    .select('id, recipient_name, event_date, resolved_apod_date, apod_title, apod_copyright, message, viewed_at')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Gift
}

export async function generateMetadata({ params }: GiftPageProps): Promise<Metadata> {
  const { id } = await params
  const gift = await getGift(id)
  if (!gift) return { title: 'Gift not found — Starry' }

  const title = `A star gift for ${gift.recipient_name}`
  const description = `Someone sent you the universe as it looked on ${new Date(gift.event_date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}.`
  const ogImageUrl = `/api/og?date=${gift.resolved_apod_date}&name=${encodeURIComponent(gift.recipient_name)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function GiftPage({ params }: GiftPageProps) {
  const { id } = await params
  const gift = await getGift(id)

  if (!gift) {
    notFound()
  }

  const isFirstView = gift.viewed_at === null

  return (
    <GiftReveal
      giftId={gift.id}
      recipientName={gift.recipient_name}
      eventDate={gift.event_date}
      resolvedApodDate={gift.resolved_apod_date}
      apodTitle={gift.apod_title ?? 'A moment in the cosmos'}
      apodCopyright={gift.apod_copyright}
      message={gift.message}
      isFirstView={isFirstView}
    />
  )
}
