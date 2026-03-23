/**
 * components/AsciiNebulaBackground.tsx
 *
 * Background layer for the /meteors page.
 * Renders the Orion Nebula JPG dimmed with CSS filters as a subtle cosmic
 * texture behind the canvas meteor shower.
 *
 * Layer order on /meteors:
 *   z-0  AsciiNebulaBackground  (this component — dim JPEG backdrop)
 *   z-1  canvas (twinkling stars + meteor trails)
 *   z-2  DOM dots + message cards
 *   z-10 header / footer UI
 */

'use client'

export default function AsciiNebulaBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/orion-nebula.jpg"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'brightness(0.28) saturate(0.6)',
          opacity: 0.95,
        }}
      />
    </div>
  )
}
