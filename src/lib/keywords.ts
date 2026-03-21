/**
 * lib/keywords.ts
 *
 * Keyword suggestion logic for the node creation flow.
 * Matches APOD title + explanation text against astronomy term categories
 * defined in src/data/keyword-map.json, then returns 2–4 suggested keywords.
 *
 * Falls back to ["Distance", "Exploration", "Unknown"] if nothing matches.
 */

import keywordMap from '@/data/keyword-map.json'

interface KeywordCategory {
  terms: string[]
  keywords: string[]
}

const categories = keywordMap as KeywordCategory[]

const FALLBACK_KEYWORDS = ['Distance', 'Exploration', 'Unknown']

/**
 * Given APOD title and explanation, return 2–4 suggested keyword strings.
 * Matches are case-insensitive. Returns up to 4 keywords from the best-matching categories.
 */
export function suggestKeywords(title: string, explanation: string): string[] {
  const combined = `${title} ${explanation}`.toLowerCase()
  const matched: string[] = []

  for (const category of categories) {
    const hit = category.terms.some((term) => combined.includes(term.toLowerCase()))
    if (hit) {
      // Add up to 2 keywords per matching category
      for (const kw of category.keywords.slice(0, 2)) {
        if (!matched.includes(kw)) {
          matched.push(kw)
        }
        if (matched.length >= 4) break
      }
    }
    if (matched.length >= 4) break
  }

  return matched.length >= 2 ? matched : FALLBACK_KEYWORDS
}
