/**
 * lib/canvas.ts
 *
 * Browser-side share card generation using the HTML Canvas API.
 * All images must be loaded from same-origin URLs (via /api/apod/image/[date])
 * to avoid canvas tainting on iOS Safari and other browsers.
 *
 * Card format: 1080×1350 (Instagram 4:5)
 *  - Top bar (y 0–120):   solid black — user note + date
 *  - Middle (y 120–1200): NASA photo, center-cropped to 1080×1080, zero overlay
 *  - Bottom bar (y 1200–1350): solid black — APOD title + copyright + CTA
 */

export interface CardOptions {
  /** Same-origin URL: /api/apod/image/{resolvedDate} */
  imageUrl: string
  note: string
  apodTitle: string
  copyright?: string
  date: string
}

const CARD_W = 1080
const CARD_H = 1350
const PHOTO_TOP = 120     // y where photo starts
const PHOTO_H = 1080      // photo occupies exactly 1080px (1:1 section)
const PHOTO_BOT = PHOTO_TOP + PHOTO_H  // 1200

/**
 * Read the Cinzel Decorative font family name from the CSS variable set by next/font/google.
 * Awaits document.fonts.ready to ensure the font file is fully loaded before canvas draws.
 */
async function getCinzelFont(): Promise<string> {
  await document.fonts.ready
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-cinzel').trim()
  return raw || 'serif'
}

/**
 * Wrap text onto canvas, returning the number of lines drawn.
 * Truncates with ellipsis if maxLines is exceeded.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = text.split(' ')
  let line = ''
  let lineCount = 0

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, startY + lineCount * lineHeight)
      line = words[n] + ' '
      lineCount++
      if (lineCount >= maxLines) {
        // Truncate remaining with ellipsis
        let remaining = words.slice(n).join(' ')
        while (
          ctx.measureText(remaining + '...').width > maxWidth &&
          remaining.length > 0
        ) {
          remaining = remaining.slice(0, -1)
        }
        ctx.fillText(remaining.trim() + '...', x, startY + lineCount * lineHeight)
        return lineCount + 1
      }
    } else {
      line = testLine
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, startY + lineCount * lineHeight)
    lineCount++
  }
  return lineCount
}

/** Load an image element from a URL, resolving when loaded. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * Generate a share card canvas from the given options.
 * Returns the HTMLCanvasElement. Call canvas.toBlob() to export.
 */
export async function generateCard(options: CardOptions): Promise<HTMLCanvasElement> {
  const { imageUrl, note, apodTitle, copyright, date } = options
  const fontFamily = await getCinzelFont()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!

  // --- Full background: black ---
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // --- Top bar (y 0–120): note + date ---
  // Note text
  if (note.trim()) {
    ctx.font = `bold 34px ${fontFamily}`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    wrapText(ctx, note.trim(), CARD_W / 2, 18, 920, 44, 2)
  }

  // Date (always shown; position shifts up if no note)
  const formattedDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  ctx.font = `24px ${fontFamily}`
  ctx.fillStyle = 'rgba(255,255,255,0.50)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(formattedDate, CARD_W / 2, PHOTO_TOP - 10)

  // --- Middle (y 120–1200): NASA photo, no overlays ---
  const img = await loadImage(imageUrl)
  // Center-crop to fill exactly 1080×1080
  const scale = Math.max(CARD_W / img.naturalWidth, PHOTO_H / img.naturalHeight)
  const sw = img.naturalWidth * scale
  const sh = img.naturalHeight * scale
  const sx = (CARD_W - sw) / 2
  const sy = PHOTO_TOP + (PHOTO_H - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh)

  // --- Bottom bar (y 1200–1350): APOD title + copyright + CTA ---
  // APOD title
  ctx.font = `26px ${fontFamily}`
  ctx.fillStyle = '#e0e4ff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const titleLines = wrapText(ctx, apodTitle, CARD_W / 2, PHOTO_BOT + 18, 940, 36, 2)

  // Copyright
  if (copyright) {
    ctx.font = `16px ${fontFamily}`
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`Photo: ${copyright}`, CARD_W / 2, PHOTO_BOT + 18 + titleLines * 36 + 8)
  }

  // CTA
  ctx.font = `bold 18px ${fontFamily}`
  ctx.fillStyle = '#818cf8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('✦ Starry', CARD_W / 2, CARD_H - 16)

  return canvas
}

/**
 * Release GPU memory held by a canvas.
 * Call this when a card canvas is no longer needed (component unmount, re-render).
 * Setting dimensions to 0 tells the browser to free the backing store.
 */
export function disposeCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

/** Convert a canvas to a Blob (PNG by default). */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob returned null'))
    }, type)
  })
}

/** Trigger a browser download of the canvas as an image file. */
export async function downloadCard(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await canvasToBlob(canvas)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
