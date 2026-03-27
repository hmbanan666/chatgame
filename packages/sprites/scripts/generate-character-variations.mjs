/**
 * Generate random color variations for a character's cloth/accent slots.
 * Keeps outline, hair, skin fixed — randomizes cloth and accent from palette pools.
 *
 * Usage: node scripts/generate-character-variations.mjs [count=10] [codename=twitchy]
 * Output: ../../apps/web-app/public/static/units/variations/
 */

import { Buffer } from 'node:buffer'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { deflateSync } from 'node:zlib'

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')

const count = Number(process.argv[2]) || 10
const codename = process.argv[3] || 'twitchy'
const scale = 4
const outDir = join(pkgDir, '../../apps/web-app/public/static/units/variations')

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

// --- Read character data ---
const charSrc = readFileSync(join(pkgDir, `src/units/data/${codename}.ts`), 'utf-8')
const FRAME_SIZE = 32

// Parse default palette
const defPalMatch = charSrc.match(/export const DEFAULT_PALETTE[^=]*=\s*\[([\s\S]*?)\]/)
const defaultPalette = []
const defaultPaletteNames = []
if (defPalMatch) {
  const REF_RE = /PALETTE\.(\w+)/g
  for (let m = REF_RE.exec(defPalMatch[1]); m !== null; m = REF_RE.exec(defPalMatch[1])) {
    defaultPalette.push(PALETTE[m[1]])
    defaultPaletteNames.push(m[1])
  }
}

// Parse slot roles
const slotRolesMatch = charSrc.match(/export const SLOT_ROLES\s*=\s*\[([\s\S]*?)\]\s*as const/)
const slotRoles = []
if (slotRolesMatch) {
  const ROLE_RE = /'(\w+)'/g
  for (let m = ROLE_RE.exec(slotRolesMatch[1]); m !== null; m = ROLE_RE.exec(slotRolesMatch[1])) {
    slotRoles.push(m[1])
  }
}

// Parse first IDLE frame for preview
const FRAME_RE = /export const IDLE_1:\s*\[number,\s*number,\s*number\]\[\]\s*=\s*\[/
const PIXEL_RE = /\[(\d+),\s*(\d+),\s*(\d+)\]/g
const frameMatch = FRAME_RE.exec(charSrc)
const pixels = []
if (frameMatch) {
  const arrayStart = frameMatch.index + frameMatch[0].length
  let depth = 1
  let end = arrayStart
  for (let i = arrayStart; i < charSrc.length && depth > 0; i++) {
    if (charSrc[i] === '[') {
      depth++
    }
    if (charSrc[i] === ']') {
      depth--
    }
    end = i
  }
  const body = charSrc.slice(arrayStart, end)
  PIXEL_RE.lastIndex = 0
  for (let m = PIXEL_RE.exec(body); m !== null; m = PIXEL_RE.exec(body)) {
    pixels.push([Number(m[1]), Number(m[2]), Number(m[3])])
  }
}

// --- Which slots to randomize ---
// Keep fixed: outline, hair_dark, hair_light, skin, skin_light, highlight
// Randomize: cloth_dark, detail, cloth_mid, accent, cloth_light
const FIXED_ROLES = ['outline', 'hair_dark', 'hair_light', 'skin', 'skin_light', 'highlight']
const variableSlots = slotRoles
  .map((role, i) => ({ role, index: i }))
  .filter(({ role }) => !FIXED_ROLES.includes(role))

console.log(`Character: ${codename}`)
console.log(`Slots: ${slotRoles.join(', ')}`)
console.log(`Variable slots: ${variableSlots.map((s) => `${s.index}:${s.role}`).join(', ')}`)
console.log(`Default palette: [${defaultPaletteNames.join(', ')}]\n`)

// Color pools per variable role (dark → light tiers)
const CLOTH_POOLS = {
  cloth_dark: [
    'darkPurple', 'darkBlue', 'darkTeal', 'darkGreen', 'darkBrown',
    'darkRed', 'darkPink', 'darkMagenta', 'darkViolet', 'darkGray',
  ],
  detail: [
    'magenta2', 'blue2', 'teal2', 'green2', 'red1',
    'pink2', 'violet2', 'brown2', 'orange2', 'grayGreen2',
  ],
  cloth_mid: [
    'violet2', 'blue2', 'teal2', 'green2', 'brown2',
    'pink2', 'magenta2', 'red1', 'orange2', 'grayGreen2',
  ],
  accent: [
    'hotPink', 'salmon', 'orange1', 'gold', 'lime',
    'lightGreen', 'lightBlue', 'paleViolet', 'yellow1', 'mint',
  ],
  cloth_light: [
    'violet3', 'blue3', 'teal3', 'grayGreen3', 'pink3',
    'brown2', 'silver', 'tan', 'lavender', 'grayGreen4',
  ],
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

function writePng(filePath, width, height, pxBuf) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0
    pxBuf.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
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

// --- Generate variations ---
mkdirSync(outDir, { recursive: true })

console.log(`Generating ${count} variations at ${scale}x\n`)

const manifest = {
  codename,
  count,
  scale,
  frameSize: FRAME_SIZE,
  slotRoles,
  defaultPalette: defaultPaletteNames,
  variableSlots: variableSlots.map((s) => s.role),
  variations: [],
  generated: new Date().toISOString(),
}

for (let v = 0; v < count; v++) {
  const palette = [...defaultPalette]
  const paletteNames = [...defaultPaletteNames]

  for (const { role, index } of variableSlots) {
    const pool = CLOTH_POOLS[role]
    if (pool) {
      const name = pool[Math.floor(Math.random() * pool.length)]
      palette[index] = PALETTE[name]
      paletteNames[index] = name
    }
  }

  const varId = `v${String(v + 1).padStart(2, '0')}`
  const w = FRAME_SIZE * scale
  const h = FRAME_SIZE * scale
  const buf = Buffer.alloc(w * h * 4)
  renderFrame(buf, w, pixels, 0, scale, palette)

  const fileName = `${codename}_${varId}.png`
  writePng(join(outDir, fileName), w, h, buf)

  const changedSlots = {}
  for (const { role, index } of variableSlots) {
    changedSlots[role] = paletteNames[index]
  }

  manifest.variations.push({
    id: varId,
    slots: changedSlots,
    file: fileName,
  })

  console.log(`  ${varId}: ${variableSlots.map(({ role, index }) => `${role}=${paletteNames[index]}`).join(', ')}`)
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nManifest: ${join(outDir, 'manifest.json')}`)
console.log('Done!')
