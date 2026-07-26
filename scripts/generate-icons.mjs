/**
 * Generates the Arohan PWA icon set.
 *
 * The container has no image tooling, so the icons are rasterised here with a
 * tiny signed-distance renderer and written out as PNGs via zlib. Re-run with
 * `node scripts/generate-icons.mjs` after changing the mark.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const OUT = path.resolve(import.meta.dirname, '../public/icons')

/* ---------------------------------------------------------------- palette */

const BG_TOP = [0x14, 0x14, 0x1d]
const BG_BOTTOM = [0x08, 0x08, 0x0c]
const GRAD_FROM = [0xff, 0x8a, 0x3d]
const GRAD_TO = [0xff, 0x5f, 0x6d]

const lerp = (a, b, t) => a + (b - a) * t
const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/* ------------------------------------------------------------- geometry */

/** Signed distance to a rounded rect centred on (cx, cy). Negative = inside. */
function sdRoundedRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r)
  const qy = Math.abs(py - cy) - (halfH - r)
  const ax = Math.max(qx, 0)
  const ay = Math.max(qy, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r
}

/**
 * The Arohan mark: a rising sun behind three ascending bars.
 * `inset` is the fraction of the canvas kept clear around the glyph, which is
 * how the maskable variant stays inside the safe zone.
 */
function buildMark(size, inset) {
  const box = size * (1 - inset * 2)
  const ox = size * inset
  const oy = size * inset

  const bars = []
  const gap = box * 0.1
  const barW = (box - gap * 2) / 3
  const heights = [0.42, 0.68, 1.0]
  for (let i = 0; i < 3; i++) {
    const w = barW
    const h = box * heights[i]
    const x = ox + i * (barW + gap)
    const y = oy + box - h
    bars.push({
      cx: x + w / 2,
      cy: y + h / 2,
      halfW: w / 2,
      halfH: h / 2,
      r: Math.min(w / 2, box * 0.055),
    })
  }

  // The sun sits in the open corner the ascending bars leave behind.
  const sun = { cx: ox + box * 0.19, cy: oy + box * 0.16, r: box * 0.135 }
  return { bars, sun, ox, oy, box }
}

/* ------------------------------------------------------------ rendering */

const SS = 4 // supersampling factor per axis

function renderIcon(size, { inset = 0.2, background = true } = {}) {
  const { bars, sun, ox, box } = buildMark(size, inset)
  const rgba = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let glyphCov = 0
      let sunCov = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS
          const py = y + (sy + 0.5) / SS

          let d = Infinity
          for (const b of bars) d = Math.min(d, sdRoundedRect(px, py, b.cx, b.cy, b.halfW, b.halfH, b.r))
          if (d < 0) glyphCov++

          const ds = sdCircle(px, py, sun.cx, sun.cy, sun.r)
          if (ds < 0 && d >= 0) sunCov++
        }
      }

      const total = SS * SS
      const gA = glyphCov / total
      const sA = (sunCov / total) * 0.85

      // Sunrise gradient runs diagonally across the mark.
      const t = clamp01(((x - ox) / box) * 0.6 + (1 - (y - ox) / box) * 0.4)
      const grad = mixRgb(GRAD_FROM, GRAD_TO, t)

      const bg = background ? mixRgb(BG_TOP, BG_BOTTOM, y / size) : [0, 0, 0]
      const bgA = background ? 1 : 0

      // Composite: background, then the dimmed sun, then the bars.
      let r = bg[0] * bgA
      let g = bg[1] * bgA
      let b = bg[2] * bgA
      let a = bgA

      for (const [col, alpha] of [
        [grad, sA],
        [grad, gA],
      ]) {
        r = col[0] * alpha + r * (1 - alpha)
        g = col[1] * alpha + g * (1 - alpha)
        b = col[2] * alpha + b * (1 - alpha)
        a = alpha + a * (1 - alpha)
      }

      const i = (y * size + x) * 4
      rgba[i] = Math.round(r)
      rgba[i + 1] = Math.round(g)
      rgba[i + 2] = Math.round(b)
      rgba[i + 3] = Math.round(a * 255)
    }
  }

  return rgba
}

/* ---------------------------------------------------------- PNG encoding */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(rgba, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ main */

mkdirSync(OUT, { recursive: true })

const targets = [
  ['icon-192.png', 192, { inset: 0.22 }],
  ['icon-512.png', 512, { inset: 0.22 }],
  ['icon-512-maskable.png', 512, { inset: 0.3 }],
  ['apple-touch-icon.png', 180, { inset: 0.22 }],
]

for (const [name, size, opts] of targets) {
  writeFileSync(path.join(OUT, name), encodePng(renderIcon(size, opts), size))
  console.log('wrote', name, `${size}x${size}`)
}

// The favicon stays vector so it keeps its edges at 16px.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#FF8A3D"/>
      <stop offset="1" stop-color="#FF5F6D"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="#0F0F16"/>
  <circle cx="27.4" cy="30.6" r="7.6" fill="url(#g)" opacity="0.85"/>
  <rect x="22" y="53.6" width="16.4" height="24.4" rx="4" fill="url(#g)"/>
  <rect x="41.8" y="46.4" width="16.4" height="31.6" rx="4" fill="url(#g)"/>
  <rect x="61.6" y="37" width="16.4" height="41" rx="4" fill="url(#g)"/>
</svg>
`
writeFileSync(path.join(OUT, 'favicon.svg'), svg)
console.log('wrote favicon.svg')
