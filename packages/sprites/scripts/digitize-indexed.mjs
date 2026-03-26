/**
 * Digitize PNG sprite sheets into palette-indexed pixel data.
 * Format: [x, y, slotIndex] — no colors stored, only palette slot references.
 *
 * Usage: node scripts/digitize-indexed.mjs <codename>
 * Reads from: references/units/<codename>/
 * Writes to:  src/units/<codename>.ts
 */

import { Buffer } from 'node:buffer'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { inflateSync } from 'node:zlib'
import { COLOR_OVERRIDES } from './color-overrides.mjs'

const PALETTE = {
  darkPurple: 0x2E222F, purple1: 0x3E3546, purple2: 0x625565,
  mauve: 0x966C6C, tan: 0xAB947A, plum: 0x694F62, lavender: 0x7F708A,
  silver: 0x9BABB2, mint: 0xC7DCD0, white: 0xFFFFFF,
  darkRed: 0x6E2727, red1: 0xB33831, red2: 0xEA4F36, redOrange: 0xF57D4A,
  crimson: 0xAE2334, brightRed: 0xE83B3B, orange1: 0xFB6B1D, orange2: 0xF79617, yellow1: 0xF9C22B,
  darkMagenta: 0x7A3045, brown1: 0x9E4539, brown2: 0xCD683D, brownOrange: 0xE6904E, gold: 0xFBB954,
  darkBrown: 0x4C3E24, olive: 0x676633, yellowGreen: 0xA2A947, lime: 0xD5E04B, paleYellow: 0xFBFF86,
  darkGreen: 0x165A4C, green1: 0x239063, green2: 0x1EBC73, lightGreen: 0x91DB69, paleGreen: 0xCDDF6C,
  darkGray: 0x313638, grayGreen1: 0x374E4A, grayGreen2: 0x547E64, grayGreen3: 0x92A984, grayGreen4: 0xB2BA90,
  darkTeal: 0x0B5E65, teal1: 0x0B8A8F, teal2: 0x0EAF9B, teal3: 0x30E1B9, paleTeal: 0x8FF8E2,
  darkBlue: 0x323353, blue1: 0x484A77, blue2: 0x4D65B4, blue3: 0x4D9BE6, lightBlue: 0x8FD3FF,
  darkViolet: 0x45293F, violet1: 0x6B3E75, violet2: 0x905EA9, violet3: 0xA884F3, paleViolet: 0xEAADED,
  darkPink: 0x753C54, pink1: 0xA24B6F, pink2: 0xCF657F, pink3: 0xED8099,
  magenta1: 0x831C5D, magenta2: 0xC32454, hotPink: 0xF04F78, salmon: 0xF68181, peach: 0xFCA790, cream: 0xFDCBB0,
}

const PALETTE_VALUES = Object.values(PALETTE)
const PALETTE_NAMES = Object.keys(PALETTE)

// Semantic slot roles for character sprites
const SLOT_ROLES = [
  'outline', // 0 — darkest, outlines
  'cloth_dark', // 1 — dark clothing/accessory
  'detail', // 2 — small details (mouth, etc)
  'hair_dark', // 3 — dark hair/fur
  'cloth_mid', // 4 — medium clothing
  'hair_light', // 5 — light hair/fur
  'accent', // 6 — accent color (cheeks, etc)
  'cloth_light', // 7 — light clothing
  'skin', // 8 — skin base
  'skin_light', // 9 — skin highlight
  'highlight', // 10 — eyes, bright highlights
]

const codename = process.argv[2]
if (!codename) {
  console.error('Usage: node scripts/digitize-indexed.mjs <codename>')
  process.exit(1)
}

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')
const assetsDir = join(pkgDir, 'references/units', codename)
const outDir = join(pkgDir, 'src/units/data')

// --- Minimal PNG decoder ---
function decodePNG(filePath) {
  const buf = readFileSync(filePath)
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== sig[i]) {
      throw new Error('Not a PNG file')
    }
  }

  let width, height, colorType
  const idatChunks = []
  let pos = 8

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }

  const compressed = Buffer.concat(idatChunks)
  const raw = inflateSync(compressed)
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 4
  const stride = width * bpp
  const pixels = new Uint8Array(width * height * 4)
  let rawPos = 0
  const prevRow = new Uint8Array(stride)
  const currRow = new Uint8Array(stride)

  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++]
    for (let i = 0; i < stride; i++) {
      currRow[i] = raw[rawPos++]
    }
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? currRow[i - bpp] : 0
      const b = prevRow[i]
      const c = i >= bpp ? prevRow[i - bpp] : 0
      switch (filter) {
        case 0: break
        case 1:
          currRow[i] = (currRow[i] + a) & 0xFF
          break
        case 2:
          currRow[i] = (currRow[i] + b) & 0xFF
          break
        case 3:
          currRow[i] = (currRow[i] + Math.floor((a + b) / 2)) & 0xFF
          break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          currRow[i] = (currRow[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xFF
          break
        }
      }
    }
    for (let x = 0; x < width; x++) {
      const si = x * bpp
      const di = (y * width + x) * 4
      pixels[di] = currRow[si]
      pixels[di + 1] = currRow[si + 1]
      pixels[di + 2] = currRow[si + 2]
      pixels[di + 3] = bpp === 4 ? currRow[si + 3] : 255
    }
    prevRow.set(currRow)
  }
  return { width, height, pixels }
}

// Find closest palette color (with optional overrides)
let colorOverrides = {}

function snapToPalette(r, g, b) {
  const origColor = (r << 16) | (g << 8) | b

  // Check manual override first
  const overrideName = colorOverrides[origColor]
  if (overrideName) {
    const idx = PALETTE_NAMES.indexOf(overrideName)
    if (idx !== -1) {
      return { paletteIdx: idx, color: PALETTE_VALUES[idx], name: overrideName }
    }
  }

  let bestDist = Infinity
  let bestIdx = 0
  for (let i = 0; i < PALETTE_VALUES.length; i++) {
    const c = PALETTE_VALUES[i]
    const pr = (c >> 16) & 0xFF
    const pg = (c >> 8) & 0xFF
    const pb = c & 0xFF
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  return { paletteIdx: bestIdx, color: PALETTE_VALUES[bestIdx], name: PALETTE_NAMES[bestIdx] }
}

// Extract frames and collect unique colors
function processSprite(img, frameWidth, frameHeight) {
  const cols = Math.floor(img.width / frameWidth)
  const uniqueColors = new Map() // color -> { paletteIdx, name, count }
  const framesRaw = [] // [{ x, y, color }][]

  for (let col = 0; col < cols; col++) {
    const pixels = []
    for (let y = 0; y < frameHeight; y++) {
      for (let x = 0; x < frameWidth; x++) {
        const si = (y * img.width + (col * frameWidth + x)) * 4
        const r = img.pixels[si]
        const g = img.pixels[si + 1]
        const b = img.pixels[si + 2]
        const a = img.pixels[si + 3]
        if (a < 128) {
          continue
        }
        const { paletteIdx, color, name } = snapToPalette(r, g, b)
        if (!uniqueColors.has(color)) {
          uniqueColors.set(color, { paletteIdx, name, count: 0 })
        }
        uniqueColors.get(color).count++
        pixels.push([x, y, color])
      }
    }
    framesRaw.push(pixels)
  }

  return { framesRaw, uniqueColors }
}

// Build slot mapping: sort unique colors by luminance → assign slot indices
function buildSlotMap(uniqueColors) {
  const entries = [...uniqueColors.entries()].sort((a, b) => {
    const lumA = ((a[0] >> 16) & 0xFF) * 0.299 + ((a[0] >> 8) & 0xFF) * 0.587 + (a[0] & 0xFF) * 0.114
    const lumB = ((b[0] >> 16) & 0xFF) * 0.299 + ((b[0] >> 8) & 0xFF) * 0.587 + (b[0] & 0xFF) * 0.114
    return lumA - lumB
  })

  const slotMap = new Map() // color -> slotIndex
  const defaultPalette = [] // slotIndex -> palette name

  entries.forEach(([color, info], idx) => {
    slotMap.set(color, idx)
    defaultPalette.push(info.name)
  })

  return { slotMap, defaultPalette }
}

// Convert raw frames to indexed
function indexFrames(framesRaw, slotMap) {
  return framesRaw.map((frame) =>
    frame.map(([x, y, color]) => [x, y, slotMap.get(color)]),
  )
}

// ---

// Load manual color overrides for this character
colorOverrides = COLOR_OVERRIDES[codename] || {}
if (Object.keys(colorOverrides).length) {
  console.log(`Using ${Object.keys(colorOverrides).length} color override(s)`)
}

console.log(`Digitizing ${codename} (indexed)...`)

const idleImg = decodePNG(join(assetsDir, 'idle.png'))
const movingImg = decodePNG(join(assetsDir, 'moving.png'))

console.log(`idle.png: ${idleImg.width}x${idleImg.height}`)
console.log(`moving.png: ${movingImg.width}x${movingImg.height}`)

// Process all sprites together to get unified color set
const idle = processSprite(idleImg, 32, 32)
const moving = processSprite(movingImg, 32, 32)

// Merge unique colors
const allColors = new Map()
for (const [color, info] of idle.uniqueColors) {
  allColors.set(color, { ...info })
}
for (const [color, info] of moving.uniqueColors) {
  if (allColors.has(color)) {
    allColors.get(color).count += info.count
  } else {
    allColors.set(color, { ...info })
  }
}

// Head
let headRaw = null
let headSize = 0
try {
  const headImg = decodePNG(join(assetsDir, 'head.png'))
  headSize = headImg.width
  const head = processSprite(headImg, headImg.width, headImg.height)
  headRaw = head.framesRaw[0]
  for (const [color, info] of head.uniqueColors) {
    if (allColors.has(color)) {
      allColors.get(color).count += info.count
    } else {
      allColors.set(color, { ...info })
    }
  }
} catch {}

const { slotMap, defaultPalette } = buildSlotMap(allColors)

console.log(`\nColor slots (${defaultPalette.length}):`)
defaultPalette.forEach((name, i) => {
  const role = SLOT_ROLES[i] || `slot_${i}`
  console.log(`  ${i}: ${name} → ${role}`)
})

// Index all frames
const idleFrames = indexFrames(idle.framesRaw, slotMap)
const movingFrames = indexFrames(moving.framesRaw, slotMap)
const headFrame = headRaw ? headRaw.map(([x, y, color]) => [x, y, slotMap.get(color)]) : null

// Generate TypeScript
mkdirSync(outDir, { recursive: true })

let ts = `// Indexed pixel data for "${codename}" — auto-generated by scripts/digitize-indexed.mjs\n`
ts += `// Format: [x, y, slotIndex] — colors come from palette, not stored per-pixel\n`
ts += `// Palette slots sorted by luminance (dark → light)\n\n`
ts += `import { PALETTE } from '../../palette'\n\n`
ts += `export const FRAME_SIZE = 32\n`
if (headSize) {
  ts += `export const HEAD_SIZE = ${headSize}\n`
}
ts += `\n`

// Slot roles
ts += `/** Semantic role for each color slot */\n`
ts += `export const SLOT_ROLES = [\n`
defaultPalette.forEach((_, i) => {
  const role = SLOT_ROLES[i] || `slot_${i}`
  ts += `  '${role}',\n`
})
ts += `] as const\n\n`

// Default palette
ts += `/** Default palette — maps slot index to PALETTE color */\n`
ts += `export const DEFAULT_PALETTE: number[] = [\n`
defaultPalette.forEach((name, i) => {
  const role = SLOT_ROLES[i] || `slot_${i}`
  ts += `  PALETTE.${name}, // ${i}: ${role}\n`
})
ts += `]\n\n`

// Helper type
ts += `export type CharacterPalette = number[]\n\n`

// Pixel data
function formatIndexedArray(pixels) {
  return pixels.map(([x, y, s]) => `  [${x},${y},${s}],`).join('\n')
}

for (let i = 0; i < idleFrames.length; i++) {
  ts += `export const IDLE_${i + 1}: [number, number, number][] = [\n${formatIndexedArray(idleFrames[i])}\n]\n\n`
}
ts += `export const IDLE_FRAMES = [${idleFrames.map((_, i) => `IDLE_${i + 1}`).join(', ')}]\n\n`

for (let i = 0; i < movingFrames.length; i++) {
  ts += `export const MOVING_${i + 1}: [number, number, number][] = [\n${formatIndexedArray(movingFrames[i])}\n]\n\n`
}
ts += `export const MOVING_FRAMES = [${movingFrames.map((_, i) => `MOVING_${i + 1}`).join(', ')}]\n\n`

if (headFrame) {
  ts += `export const HEAD: [number, number, number][] = [\n${formatIndexedArray(headFrame)}\n]\n`
}

const outPath = join(outDir, `${codename}.ts`)
writeFileSync(outPath, ts)
console.log(`\nSaved: ${outPath} (${(ts.length / 1024).toFixed(1)} KB)`)
