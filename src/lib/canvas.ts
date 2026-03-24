/**
 * lib/canvas.ts
 *
 * Browser-side share card generation using the HTML Canvas API.
 * All images must be loaded from same-origin URLs (via /api/apod/image/[date])
 * to avoid canvas tainting on iOS Safari and other browsers.
 *
 * Card format: 1080×1350 (Instagram 4:5) — always fixed dimensions.
 *  - Top bar:    solid black — optional "To [name]" (30px italic) + user note (34px bold)
 *    · No displayName: 120px tall, photo is 1080px
 *    · With displayName: 160px tall, photo is 1040px (keeps 1350 total)
 *  - Middle:     NASA photo, center-cropped, zero overlay
 *  - Bottom bar (150px): solid black — APOD title + copyright + date + URL pill badge
 *    · Date sits above pill badge at CARD_H - 44
 *    · Pill: semi-transparent dark background (rgba(0,0,0,0.5)) with indigo URL text
 *
 * Decorations: deterministic full-width meteor shower + micro-stars across
 * the ENTIRE width of both black bars. Drawn first so text renders on top.
 */

export interface CardOptions {
  /** Same-origin URL: /api/apod/image/{resolvedDate} */
  imageUrl: string
  note: string
  apodTitle: string
  copyright?: string
  date: string
  /** Name shown as "To [name]" in top-left. Max 15 chars enforced in UI. */
  displayName?: string
}

const CARD_W = 1080
const CARD_H = 1350

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
 * Draw deterministic meteor streak decorations on the black bars.
 * All positions are hardcoded — no Math.random — so every render is identical.
 * Meteors span the ENTIRE width of both bars (no safe-zone restriction).
 * ALL meteors travel from upper-right → lower-left (~60° from horizontal),
 * matching a real meteor shower reference photo. Drawn behind all text.
 */
function drawMeteorDecorations(
  ctx: CanvasRenderingContext2D,
  photoTop: number,   // y where photo starts (120 or 160)
  photoBotY: number,  // y where photo ends / bottom bar starts (always 1200)
): void {
  // Helper: draw one meteor streak.
  // Convention: (x1,y1) is the fading tail (upper-right), (x2,y2) is the bright head (lower-left).
  function drawMeteor(x1: number, y1: number, x2: number, y2: number, width = 2.0) {
    const grad = ctx.createLinearGradient(x2, y2, x1, y1)
    grad.addColorStop(0, 'rgba(255,255,255,0.55)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.save()
    ctx.strokeStyle = grad
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    // Bright dot at head (lower-left end)
    ctx.fillStyle = 'rgba(255,255,255,0.70)'
    ctx.beginPath()
    ctx.arc(x2, y2, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Helper: draw one tiny background star
  function drawStar(x: number, y: number, r = 1, opacity = 0.10) {
    ctx.save()
    ctx.fillStyle = `rgba(255,255,255,${opacity})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ── TOP BAR — full-width meteor shower (y range: 0 to photoTop) ──
  // ~13 meteors spread across entire top bar width, upper-right → lower-left
  drawMeteor(95,   5,   40,   43,  1.5)
  drawMeteor(180,  25,  125,  63,  1.2)
  drawMeteor(290,  8,   238,  46,  2.0)
  drawMeteor(385,  40,  340,  75,  1.0)
  drawMeteor(470,  12,  425,  50,  1.8)
  drawMeteor(555,  55,  510,  90,  1.2)
  drawMeteor(640,  18,  595,  55,  1.5)
  drawMeteor(720,  65,  675, 100,  1.0)
  drawMeteor(810,  10,  758,  50,  2.2)
  drawMeteor(880,  48,  835,  83,  1.3)
  drawMeteor(960,  22,  912,  58,  1.8)
  drawMeteor(1040,  8,  990,  43,  1.5)
  drawMeteor(1065, 60, 1022,  93,  1.0)

  // Top bar tiny stars — spread across full width
  drawStar(35,  photoTop * 0.15, 1.0, 0.15)
  drawStar(110, photoTop * 0.55, 1.0, 0.13)
  drawStar(210, photoTop * 0.30, 1.2, 0.14)
  drawStar(330, photoTop * 0.70, 0.8, 0.12)
  drawStar(420, photoTop * 0.45, 1.0, 0.10)
  drawStar(530, photoTop * 0.20, 1.1, 0.13)
  drawStar(620, photoTop * 0.65, 0.9, 0.11)
  drawStar(700, photoTop * 0.35, 1.0, 0.15)
  drawStar(780, photoTop * 0.80, 1.0, 0.13)
  drawStar(870, photoTop * 0.25, 1.2, 0.12)
  drawStar(950, photoTop * 0.60, 1.0, 0.14)
  drawStar(1020, photoTop * 0.40, 0.9, 0.13)

  // ── BOTTOM BAR — full-width meteor shower ──
  const b = photoBotY  // bottom bar starts here

  drawMeteor(85,   b + 12,  40,  b + 48,  1.5)
  drawMeteor(175,  b + 55, 130,  b + 91,  1.2)
  drawMeteor(265,  b + 8,  218,  b + 45,  2.0)
  drawMeteor(360,  b + 65, 315,  b + 98,  1.0)
  drawMeteor(445,  b + 20, 398,  b + 57,  1.8)
  drawMeteor(535,  b + 72, 492, b + 105,  1.2)
  drawMeteor(630,  b + 15, 582,  b + 51,  1.5)
  drawMeteor(715,  b + 58, 670,  b + 93,  1.0)
  drawMeteor(805,  b + 10, 755,  b + 48,  2.2)
  drawMeteor(890,  b + 68, 845, b + 101,  1.3)
  drawMeteor(965,  b + 25, 918,  b + 61,  1.8)
  drawMeteor(1050,  b + 8, 1002,  b + 45,  1.5)
  drawMeteor(1068, b + 72, 1025, b + 105,  1.0)

  // Bottom bar tiny stars — spread across full width
  drawStar(42,  b + 28,  1.0, 0.15)
  drawStar(138, b + 90,  1.0, 0.13)
  drawStar(228, b + 48,  1.1, 0.14)
  drawStar(318, b + 110, 0.9, 0.12)
  drawStar(412, b + 32,  1.0, 0.10)
  drawStar(508, b + 85,  1.1, 0.13)
  drawStar(598, b + 55,  0.9, 0.11)
  drawStar(692, b + 118, 1.0, 0.15)
  drawStar(782, b + 38,  1.0, 0.13)
  drawStar(872, b + 92,  1.2, 0.12)
  drawStar(952, b + 62,  1.0, 0.14)
  drawStar(1038, b + 128, 0.9, 0.13)

  // Suppress unused-variable lint
  void photoTop
}

/**
 * Generate a share card canvas from the given options.
 * Returns the HTMLCanvasElement. Call canvas.toBlob() to export.
 */
export async function generateCard(options: CardOptions): Promise<HTMLCanvasElement> {
  const { imageUrl, note, apodTitle, copyright, date, displayName } = options
  const fontFamily = await getCinzelFont()

  // Dynamic layout: expand top bar when a name is provided
  const hasName = !!displayName?.trim()
  const PHOTO_TOP = hasName ? 160 : 120
  const PHOTO_H   = hasName ? 1040 : 1080
  const PHOTO_BOT = PHOTO_TOP + PHOTO_H   // always 1200

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!

  // 1. Full background: black
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // 2. Meteor decorations (drawn first, behind all text)
  drawMeteorDecorations(ctx, PHOTO_TOP, PHOTO_BOT)

  // 3. "To [name]" — top-left, italic, clearly readable
  if (hasName) {
    ctx.font = `italic 30px ${fontFamily}`
    ctx.fillStyle = 'rgba(255,255,255,0.70)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`To ${displayName!.trim()}`, 50, 14)
  }

  // 4. Note text (shifts down when name is present to avoid collision)
  const noteY = hasName ? 52 : 18
  if (note.trim()) {
    ctx.font = `bold 34px ${fontFamily}`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    wrapText(ctx, note.trim(), CARD_W / 2, noteY, 920, 44, 2)
  }

  // 5. Format date for use in bottom bar (drawn later)
  const formattedDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  // 6. NASA photo — center-cropped to fill the photo section exactly
  const img = await loadImage(imageUrl)
  const scale = Math.max(CARD_W / img.naturalWidth, PHOTO_H / img.naturalHeight)
  const sw = img.naturalWidth * scale
  const sh = img.naturalHeight * scale
  const sx = (CARD_W - sw) / 2
  const sy = PHOTO_TOP + (PHOTO_H - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh)

  // 7. Bottom bar text — APOD title + copyright + CTA
  ctx.font = `26px ${fontFamily}`
  ctx.fillStyle = '#e0e4ff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const titleLines = wrapText(ctx, apodTitle, CARD_W / 2, PHOTO_BOT + 18, 940, 36, 2)

  if (copyright) {
    ctx.font = `16px ${fontFamily}`
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`Photo: ${copyright}`, CARD_W / 2, PHOTO_BOT + 18 + titleLines * 36 + 8)
  }

  // Date — above "✦ Starry"
  ctx.font = `24px ${fontFamily}`
  ctx.fillStyle = 'rgba(255,255,255,0.50)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(formattedDate, CARD_W / 2, CARD_H - 44)

  // URL pill badge — centered at bottom
  const urlText = '✦visit → https://starry-neon.vercel.app'
  ctx.font = `bold 18px ${fontFamily}`
  const textMetrics = ctx.measureText(urlText)
  const textW = textMetrics.width
  const pillPadX = 16
  const pillPadY = 6
  const pillW = textW + pillPadX * 2
  const pillH = 18 + pillPadY * 2
  const pillX = CARD_W / 2 - pillW / 2
  const pillY = CARD_H - 16 - pillH
  const pillR = 12

  // Draw pill background
  ctx.beginPath()
  ctx.moveTo(pillX + pillR, pillY)
  ctx.lineTo(pillX + pillW - pillR, pillY)
  ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR, pillR)
  ctx.lineTo(pillX + pillW, pillY + pillH - pillR)
  ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH, pillR)
  ctx.lineTo(pillX + pillR, pillY + pillH)
  ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR, pillR)
  ctx.lineTo(pillX, pillY + pillR)
  ctx.arcTo(pillX, pillY, pillX + pillR, pillY, pillR)
  ctx.closePath()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fill()

  // Draw URL text on top of pill
  ctx.fillStyle = '#818cf8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(urlText, CARD_W / 2, CARD_H - 16)

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
