/**
 * Create NPC sprite data from twitchy by remapping slots:
 * - slot 2 (detail) → slot 4 (cloth_mid) — removes shirt logo
 * - slot 6 (accent) → slot 4 (cloth_mid) — removes accent highlights
 * - Trim top hair rows to make a shorter hairstyle
 *
 * Usage: node scripts/create-npc-from-twitchy.mjs
 * Output: src/units/data/villager.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')

const src = readFileSync(join(pkgDir, 'src/units/data/twitchy.ts'), 'utf-8')

// Slot remap: detail(2) → cloth_mid(4), accent(6) → cloth_mid(4)
const SLOT_REMAP = { 2: 4, 6: 4 }

// Hair slots
const HAIR_SLOTS = new Set([3, 5]) // hair_dark, hair_light

const PIXEL_RE = /\[(\d+),\s*(\d+),\s*(\d+)\]/g

// For shorter hair: remove top 1-2 rows of hair pixels per frame
// We'll detect the topmost row with hair and remove it
function remapFrame(frameStr) {
  const pixels = []
  PIXEL_RE.lastIndex = 0
  for (let m = PIXEL_RE.exec(frameStr); m !== null; m = PIXEL_RE.exec(frameStr)) {
    pixels.push([Number(m[1]), Number(m[2]), Number(m[3])])
  }

  // Find topmost hair row
  let minHairY = Infinity
  for (const [, y, slot] of pixels) {
    if (HAIR_SLOTS.has(slot) && y < minHairY) {
      minHairY = y
    }
  }

  // Process pixels: remap slots + trim top hair row
  const result = pixels
    .filter(([, y, slot]) => {
      // Remove topmost row of hair pixels
      if (HAIR_SLOTS.has(slot) && y === minHairY) {
        return false
      }
      return true
    })
    .map(([x, y, slot]) => {
      const newSlot = SLOT_REMAP[slot] ?? slot
      return `[${x}, ${y}, ${newSlot}]`
    })

  return result.join(',\n  ')
}

// Extract and remap all frame arrays
const FRAME_RE = /export const (\w+):\s*\[number,\s*number,\s*number\]\[\]\s*=\s*\[/g
let output = src

// Replace frame contents
const frames = []
FRAME_RE.lastIndex = 0
for (let match = FRAME_RE.exec(src); match !== null; match = FRAME_RE.exec(src)) {
  const name = match[1]
  const arrayStart = match.index + match[0].length
  let depth = 1
  let end = arrayStart
  for (let i = arrayStart; i < src.length && depth > 0; i++) {
    if (src[i] === '[') {
      depth++
    }
    if (src[i] === ']') {
      depth--
    }
    end = i
  }
  const body = src.slice(arrayStart, end)
  frames.push({ name, start: arrayStart, end, body })
}

// Rebuild from end to start so indices stay valid
for (let i = frames.length - 1; i >= 0; i--) {
  const { start, end, body } = frames[i]
  const remapped = remapFrame(body)
  output = `${output.slice(0, start)}\n  ${remapped}\n${output.slice(end)}`
}

// Update header
output = output.replace(
  '// Indexed pixel data for "twitchy"',
  '// Indexed pixel data for "villager" — derived from twitchy',
)

// Update palette
output = output.replace(
  /export const DEFAULT_PALETTE[^=]*=\s*\[[\s\S]*?\]/,
  `export const DEFAULT_PALETTE: number[] = [
  PALETTE.darkPurple, // 0: outline
  PALETTE.darkTeal, // 1: cloth_dark
  PALETTE.darkTeal, // 2: detail (= cloth, no logo)
  PALETTE.brownOrange, // 3: hair_dark
  PALETTE.teal2, // 4: cloth_mid
  PALETTE.gold, // 5: hair_light
  PALETTE.teal2, // 6: accent (= cloth)
  PALETTE.teal3, // 7: cloth_light
  PALETTE.peach, // 8: skin
  PALETTE.cream, // 9: skin_light
  PALETTE.white, // 10: highlight
]`,
)

// Update slot roles comment
output = output.replace(
  `'detail',`,
  `'detail', // mapped to cloth_mid`,
)
output = output.replace(
  `'accent',`,
  `'accent', // mapped to cloth_mid`,
)

const outPath = join(pkgDir, 'src/units/data/villager.ts')
writeFileSync(outPath, output)
console.log(`Created: ${outPath}`)
console.log(`Frames remapped: ${frames.length}`)
console.log(`Slot remaps: detail(2)→cloth_mid(4), accent(6)→cloth_mid(4)`)
console.log('Hair trimmed: removed topmost hair row per frame')
