/**
 * next.config.ts
 *
 * Next.js configuration for Starry.
 * Key concern: APOD images are always served through /api/apod/image/[date]
 * (same-origin proxy) so no external image domains need to be whitelisted here.
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Images are proxied through /api/apod/image/[date] — no remote domains needed.
  // If you ever add next/image with direct NASA URLs, add them here.
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
