/**
 * app/meteors/page.tsx
 *
 * Server component wrapper for the /meteors page.
 * Provides metadata and renders the client component.
 */

import type { Metadata } from 'next'
import MeteorShowerClient from './client'

export const metadata: Metadata = {
  title: 'Meteor Shower — Wishes Across the Sky | Starry',
  description: 'Read anonymous wishes flying across the night sky.',
}

export default function MeteorsPage() {
  return <MeteorShowerClient />
}
