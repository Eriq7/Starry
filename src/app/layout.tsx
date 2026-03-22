/**
 * app/layout.tsx
 *
 * Root layout for Starry. Sets global metadata, loads global CSS,
 * and wraps all pages in the dark space-themed shell.
 *
 * Fonts:
 *  - Cinzel Decorative (--font-cinzel): ornate serif for headings
 *  - System sans-serif: body text (performance + readability)
 *
 * Note: No persistent navigation — pages are designed as immersive full-screen
 * experiences. Navigation is contextual per page.
 */

import type { Metadata, Viewport } from 'next'
import { Cinzel_Decorative } from 'next/font/google'
import './globals.css'

const cinzelDecorative = Cinzel_Decorative({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
})

export const metadata: Metadata = {
  title: {
    default: 'Starry — Your Universe, Your Moments',
    template: '%s — Starry',
  },
  description:
    'Discover what the universe looked like on your most important days. Generate beautiful space cards to share with the world.',
  keywords: ['astronomy', 'APOD', 'NASA', 'space', 'share card', 'universe', 'cosmos'],
  openGraph: {
    type: 'website',
    siteName: 'Starry',
    title: 'Starry — Your Universe, Your Moments',
    description: 'Discover what the universe looked like on your most important days.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starry — Your Universe, Your Moments',
    description: 'Discover what the universe looked like on your most important days.',
  },
}

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cinzelDecorative.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
