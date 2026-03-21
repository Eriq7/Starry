/**
 * components/KeywordPicker.tsx
 *
 * Keyword selection for the node creation flow.
 * Shows suggested keywords (derived from APOD title + explanation) as pill chips.
 * Users can tap suggested keywords or type their own.
 *
 * Selection range: 1–4 keywords.
 */

'use client'

import { useState } from 'react'

interface KeywordPickerProps {
  suggestions: string[]
  selected: string[]
  onChange: (keywords: string[]) => void
}

const MAX_KEYWORDS = 4

export default function KeywordPicker({ suggestions, selected, onChange }: KeywordPickerProps) {
  const [custom, setCustom] = useState('')

  function toggle(kw: string) {
    if (selected.includes(kw)) {
      onChange(selected.filter((k) => k !== kw))
    } else if (selected.length < MAX_KEYWORDS) {
      onChange([...selected, kw])
    }
  }

  function addCustom() {
    const trimmed = custom.trim()
    if (!trimmed || selected.includes(trimmed) || selected.length >= MAX_KEYWORDS) return
    onChange([...selected, trimmed])
    setCustom('')
  }

  return (
    <div className="w-full space-y-3">
      <p className="text-sm text-white/60 tracking-wide">
        Choose keywords <span className="text-white/30">(up to {MAX_KEYWORDS})</span>
      </p>

      {/* Suggested chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((kw) => {
          const isSelected = selected.includes(kw)
          return (
            <button
              key={kw}
              type="button"
              onClick={() => toggle(kw)}
              className="px-3 py-1.5 rounded-full text-sm transition-all duration-150"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                  : 'rgba(255,255,255,0.08)',
                border: isSelected
                  ? '1px solid rgba(129,140,248,0.6)'
                  : '1px solid rgba(255,255,255,0.12)',
                color: isSelected ? '#fff' : 'rgba(255,255,255,0.65)',
                boxShadow: isSelected ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {kw}
            </button>
          )
        })}
      </div>

      {/* Custom keyword input */}
      {selected.length < MAX_KEYWORDS && (
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder="Add your own…"
            maxLength={24}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!custom.trim()}
            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Add
          </button>
        </div>
      )}

      {/* Selected display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{
                background: 'rgba(129,140,248,0.15)',
                border: '1px solid rgba(129,140,248,0.35)',
                color: '#c7d2fe',
              }}
            >
              {kw}
              <button
                type="button"
                onClick={() => toggle(kw)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
