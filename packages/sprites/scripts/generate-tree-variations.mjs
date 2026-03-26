/**
 * Generate random leaf-color variations for trees within a biome's hue range.
 * Keeps trunk colors fixed, randomizes leaf slots from a pool of similar-hue palette colors.
 *
 * Usage: node scripts/generate-tree-variations.mjs [count=10] [biome=GREEN]
 * Output: ../../apps/web-app/public/static/trees/variations/
 */

import { Buffer } from 'node:buffer'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { deflateSync } from 'node:zlib'

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')

const count = Number(process.argv[2]) || 10
const biomeArg = (process.argv[3] || 'GREEN').toUpperCase()
const scale = 4
const outDir = join(pkgDir, '../../apps/web-app/public/static/trees/variations')

// --- Read palette ---
const paletteSrc = readFileSync(join(pkgDir, 'src/palette.ts'), 'utf-8')
const PALETTE = {}
const PALETTE_NAMES = {}
const PAL_RE = /(\w+):\s*(0x[0-9A-Fa-f]+)/g
for (let m = PAL_RE.exec(paletteSrc); m !== null; m = PAL_RE.exec(paletteSrc)) {
  const val = Number(m[2])
  PALETTE[m[1]] = val
  PALETTE_NAMES[val] = m[1]
}

// --- Color pools by biome hue, split into 5 luminance tiers (dark → light) ---
// Each tier = possible colors for that leaf slot
const LEAF_POOLS = {
  GREEN: [
    // leaf_0 (darkest)
    ['darkGreen', 'grayGreen1', 'grayGreen2'],
    // leaf_1
    ['green1', 'grayGreen2', 'grayGreen3'],
    // leaf_2
    ['green2', 'lightGreen', 'grayGreen3'],
    // leaf_3
    ['lightGreen', 'paleGreen', 'grayGreen4'],
    // leaf_4 (lightest)
    ['paleGreen', 'mint', 'lightGreen'],
  ],
  BLUE: [
    ['darkBlue', 'darkViolet', 'darkGray', 'darkTeal'],
    ['blue1', 'violet1', 'grayGreen1', 'teal1'],
    ['blue2', 'violet2', 'grayGreen2', 'teal2'],
    ['blue3', 'violet3', 'silver', 'teal3'],
    ['lightBlue', 'paleViolet', 'paleTeal', 'mint'],
  ],
  TEAL: [
    ['darkTeal', 'darkGreen', 'darkGray', 'darkBlue'],
    ['teal1', 'green1', 'grayGreen2', 'blue1'],
    ['teal2', 'green2', 'grayGreen3', 'blue2'],
    ['teal3', 'lightGreen', 'grayGreen4', 'blue3'],
    ['paleTeal', 'paleGreen', 'mint', 'lightBlue'],
  ],
  STONE: [
    ['darkGray', 'darkGreen', 'darkBrown', 'darkTeal'],
    ['grayGreen1', 'olive', 'plum', 'green1'],
    ['grayGreen2', 'lavender', 'brown2', 'teal1'],
    ['grayGreen3', 'silver', 'tan', 'grayGreen4'],
    ['grayGreen4', 'mint', 'cream', 'paleGreen'],
  ],
  TOXIC: [
    ['darkBrown', 'darkGray', 'darkGreen', 'olive'],
    ['olive', 'grayGreen1', 'brown1', 'darkMagenta'],
    ['yellowGreen', 'grayGreen2', 'brown2', 'green2'],
    ['lime', 'lightGreen', 'gold', 'yellow1'],
    ['paleYellow', 'paleGreen', 'cream', 'mint'],
  ],
  VIOLET: [
    ['darkViolet', 'darkPink', 'darkBlue', 'darkMagenta'],
    ['violet1', 'pink1', 'blue1', 'magenta1'],
    ['violet2', 'pink2', 'blue2', 'magenta2'],
    ['violet3', 'pink3', 'blue3', 'hotPink'],
    ['paleViolet', 'peach', 'lightBlue', 'salmon'],
  ],
}

// --- Read tree data ---
const treeSrc = readFileSync(join(pkgDir, 'src/trees/data.ts'), 'utf-8')
const FRAME_SIZE = 32
const LEAF_SLOT_START = 7

// Parse default palette (trunk part)
const trunkPalette = []
const defPalMatch = treeSrc.match(/export const DEFAULT_PALETTE[^=]*=\s*\[([\s\S]*?)\]/)
if (defPalMatch) {
  const REF_RE = /PALETTE\.(\w+)/g
  for (let m = REF_RE.exec(defPalMatch[1]); m !== null; m = REF_RE.exec(defPalMatch[1])) {
    trunkPalette.push(PALETTE[m[1]])
  }
}

// Parse tree pixel arrays
const TREE_RE = /export const (TREE_\d+):\s*\[number,\s*number,\s*number\]\[\]\s*=\s*\[/g
const PIXEL_RE = /\[(\d+),\s*(\d+),\s*(\d+)\]/g
const trees = []

for (let match = TREE_RE.exec(treeSrc); match !== null; match = TREE_RE.exec(treeSrc)) {
  const arrayStart = match.index + match[0].length
  let depth = 1
  let end = arrayStart
  for (let i = arrayStart; i < treeSrc.length && depth > 0; i++) {
    if (treeSrc[i] === '[') {
      depth++
    }
    if (treeSrc[i] === ']') {
      depth--
    }
    end = i
  }
  const body = treeSrc.slice(arrayStart, end)
  const pixels = []
  PIXEL_RE.lastIndex = 0
  for (let m = PIXEL_RE.exec(body); m !== null; m = PIXEL_RE.exec(body)) {
    pixels.push([Number(m[1]), Number(m[2]), Number(m[3])])
  }
  trees.push({ name: match[1], pixels })
}

// --- PNG encoder ---
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0)
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}

function writePng(filePath, width, height, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0
    pixels.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(filePath, png)
  return png.length
}

function renderFrame(buf, totalWidth, frameData, offsetX, s, palette) {
  for (const [x, y, slot] of frameData) {
    const color = palette[slot]
    const r = (color >> 16) & 0xFF
    const g = (color >> 8) & 0xFF
    const b = color & 0xFF
    for (let dy = 0; dy < s; dy++) {
      for (let dx = 0; dx < s; dx++) {
        const px = offsetX + x * s + dx
        const py = y * s + dy
        const i = (py * totalWidth + px) * 4
        buf[i] = r
        buf[i + 1] = g
        buf[i + 2] = b
        buf[i + 3] = 255
      }
    }
  }
}

// --- Generate random leaf palettes ---
function randomLeafPalette(pools) {
  return pools.map((tier) => {
    const name = tier[Math.floor(Math.random() * tier.length)]
    return { name, color: PALETTE[name] }
  })
}

// --- Main ---
const pools = LEAF_POOLS[biomeArg]
if (!pools) {
  console.error(`Unknown biome: ${biomeArg}. Available: ${Object.keys(LEAF_POOLS).join(', ')}`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

console.log(`Generating ${count} random ${biomeArg} variations for ${trees.length} trees at ${scale}x\n`)

const manifest = {
  biome: biomeArg,
  count,
  scale,
  frameSize: FRAME_SIZE,
  trees: [],
  variations: [],
  generated: new Date().toISOString(),
}

for (let v = 0; v < count; v++) {
  const leafCombo = randomLeafPalette(pools)
  const leafNames = leafCombo.map((l) => l.name)
  const leafColors = leafCombo.map((l) => l.color)

  // Build full palette: trunk (slots 0-6) + random leaves (slots 7-11)
  const palette = trunkPalette.slice(0, LEAF_SLOT_START).concat(leafColors)

  const varId = `v${String(v + 1).padStart(2, '0')}`

  const variation = {
    id: varId,
    leafSlots: leafNames,
    files: [],
  }

  for (let t = 0; t < trees.length; t++) {
    const tree = trees[t]
    const w = FRAME_SIZE * scale
    const h = FRAME_SIZE * scale
    const buf = Buffer.alloc(w * h * 4)
    renderFrame(buf, w, tree.pixels, 0, scale, palette)

    const fileName = `${biomeArg.toLowerCase()}_tree${t + 1}_${varId}.png`
    writePng(join(outDir, fileName), w, h, buf)
    variation.files.push(fileName)
  }

  manifest.variations.push(variation)
  console.log(`  ${varId}: [${leafNames.join(', ')}]`)
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nManifest: ${join(outDir, 'manifest.json')}`)
console.log('Done!')
