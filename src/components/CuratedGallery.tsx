/**
 * components/CuratedGallery.tsx
 *
 * Gallery of curated iconic astronomy photos for users who enter pre-1995 dates.
 * Images are loaded via the existing /api/apod/image/[date] proxy using each
 * photo's APOD date — no separate storage bucket required.
 *
 * Layout: responsive 2-column grid of cards with thumbnail, title, and category.
 * Selecting a photo calls onPick(apodDate, title, copyright) so the parent
 * (explore page) can continue to the keyword/note/card flow.
 *
 * Category filter row at top lets users browse by theme.
 */

'use client'

import { useState } from 'react'
import curatedPhotos from '@/data/curated-photos.json'

interface CuratedPhoto {
  id: string
  apodDate: string
  title: string
  credit: string
  description: string
  category: string
  keywords: string[]
}

interface CuratedGalleryProps {
  /** Called when the user picks a photo */
  onPick: (apodDate: string, title: string, credit: string) => void
  onBack: () => void
}

const photos = curatedPhotos as CuratedPhoto[]

// Unique categories in display order
const ALL_CATEGORIES = 'All'
const categories = [ALL_CATEGORIES, ...Array.from(new Set(photos.map((p) => p.category)))]

export default function CuratedGallery({ onPick, onBack }: CuratedGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const filtered =
    selectedCategory === ALL_CATEGORIES
      ? photos
      : photos.filter((p) => p.category === selectedCategory)

  return (
    <div className="w-full">
      {/* Back button + heading */}
      <div className="mb-5">
        <button
          onClick={onBack}
          className="text-sm mb-4 transition-colors block"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Change date
        </button>
        <h2 className="text-lg font-light text-white mb-1">Choose a cosmic moment</h2>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your date predates APOD. Pick an iconic image to represent your era.
        </p>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all"
            style={
              selectedCategory === cat
                ? {
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white',
                  }
                : {
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.5)',
                  }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((photo) => {
          const imageUrl = `/api/apod/image/${photo.apodDate}`
          const isLoaded = loadedImages.has(photo.id)

          return (
            <button
              key={photo.id}
              onClick={() => onPick(photo.apodDate, photo.title, photo.credit)}
              className="group relative rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-square overflow-hidden">
                {/* Placeholder */}
                {!isLoaded && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse at center, #0d0d2e 0%, #030712 100%)',
                    }}
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                  loading="lazy"
                  onLoad={() => setLoadedImages((prev) => new Set(prev).add(photo.id))}
                />
                {/* Category badge */}
                <div
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {photo.category}
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p
                  className="text-xs font-medium leading-snug line-clamp-2"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {photo.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {photo.credit}
                </p>
              </div>

              {/* Hover overlay */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(129,140,248,0.5)' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
