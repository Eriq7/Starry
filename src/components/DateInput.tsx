/**
 * components/DateInput.tsx
 *
 * Date picker for the explore flow.
 * Constraints: minimum 1995-06-16 (APOD start date), maximum today (no future dates).
 * Includes a shortcut to jump to today's date.
 *
 * Emits `date_entered` analytics event on submit.
 */

'use client'

import { useState } from 'react'
import { APOD_START_DATE } from '@/lib/constants'

interface DateInputProps {
  onSubmit: (date: string) => void
  isLoading?: boolean
  defaultDate?: string
}

export default function DateInput({ onSubmit, isLoading, defaultDate }: DateInputProps) {
  const today = new Date().toISOString().split('T')[0]
  const [value, setValue] = useState(defaultDate ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value) {
      setError('Please enter a date.')
      return
    }
    if (value < APOD_START_DATE) {
      setError(`APOD starts on June 16, 1995. Pre-1995 curated gallery coming soon.`)
      return
    }
    if (value > today) {
      setError("You can't visit the future (yet).")
      return
    }
    setError(null)
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
      <div>
        <label htmlFor="date-input" className="block text-sm text-white/60 mb-2 tracking-wide">
          Enter a date
        </label>
        <input
          id="date-input"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={APOD_START_DATE}
          max={today}
          className="w-full px-4 py-3 rounded-xl text-white text-base appearance-none outline-none focus:ring-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            colorScheme: 'dark',
          }}
          onFocus={(e) =>
            (e.target.style.boxShadow = '0 0 0 2px rgba(129,140,248,0.5)')
          }
          onBlur={(e) => (e.target.style.boxShadow = '')}
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isLoading
              ? 'rgba(99,102,241,0.4)'
              : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
          }}
        >
          {isLoading ? 'Loading…' : 'See my universe'}
        </button>

        <button
          type="button"
          onClick={() => {
            setValue(today)
            setError(null)
          }}
          className="px-4 py-3 rounded-xl text-xs text-white/50 hover:text-white/80 transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Today
        </button>
      </div>
    </form>
  )
}
