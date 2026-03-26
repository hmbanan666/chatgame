/**
 * Generate PNG images for trees with various biome palettes.
 *
 * Usage: node scripts/generate-trees.mjs [scale=4] [outDir]
 * Reads from:  src/trees/data.ts + src/palette.ts
 * Writes to:   outDir (default: ../../apps/web-app/public/static/trees/)
 */

import { Buffer } from 'node:buffer'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { deflateSync } from 'node:zlib'

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')

const scale = Number(process.argv[2]) || 4
const outDir = process.argv[3] || join(pkgDir, '../../apps/web-app/public/static/trees')

// Read palette
const paletteSrc = readFileSync(join(pkgDir, 'src/palette.ts'), 'utf-8')
const PALETTE = {}
const PAL_RE = /(\w+):\s*(0x[0-9A-Fa-f]+)/g
for (let m = PAL_RE.exec(paletteSrc); m !== null; m = PAL_RE.exec(paletteSrc)) {
  PALETTE[m[1]] = Number(m[2])
}

// Read tree data
const treeSrc = readFileSync(join(pkgDir, 'src/trees/data.ts'), 'utf-8')

const FRAME_SIZE = 32
const LEAF_SLOT_START = 7

// Parse DEFAULT_PALETTE
const defaultPalette = []
const defPalMatch = treeSrc.match(/export const DEFAULT_PALETTE[^=]*=\s*\[([\s\S]*?)\]/)
if (defPalMatch) {
  const REF_RE = /PALETTE\.(\w+)/g
  for (let m = REF_RE.exec(defPalMatch[1]); m !== null; m = REF_RE.exec(defPalMatch[1])) {
    defaultPalette.push(PALETTE[m[1]])
  }
}

// Parse biome leaf palettes
const BIOME_RE = /(\w+):\s*\[([^\]]+)\]/g
const biomeSectionMatch = treeSrc.match(/BIOME_LEAF_PALETTES[^{]*\{([\s\S]*?)\}/)
const biomePalettes = {}
if (biomeSectionMatch) {
  for (let m = BIOME_RE.exec(biomeSectionMatch[1]); m !== null; m = BIOME_RE.exec(biomeSectionMatch[1])) {
    const name = m[1]
    const colors = []
    const INNER_RE = /PALETTE\.(\w+)/g
    for (let cm = INNER_RE.exec(m[2]); cm !== null; cm = INNER_RE.exec(m[2])) {
      colors.push(PALETTE[cm[1]])
    }
    biomePalettes[name] = colors
  }
}

function getTreePalette(biome) {
  const palette = [...defaultPalette]
  const leaves = biomePalettes[biome]
  if (leaves) {
    for (let i = 0; i < leaves.length; i++) {
      palette[LEAF_SLOT_START + i] = leaves[i]
    }
  }
  return palette
}

// Parse tree arrays
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

// --- Generate ---
mkdirSync(outDir, { recursive: true })

const biomes = Object.keys(biomePalettes)
console.log(`Generating ${trees.length} trees × ${biomes.length} biomes at ${scale}x → ${outDir}\n`)

// Generate manifest
const manifest = { scale, frameSize: FRAME_SIZE, biomes, trees: [], generated: new Date().toISOString() }

for (const tree of trees) {
  const treeIdx = trees.indexOf(tree) + 1

  for (const biome of biomes) {
    const palette = getTreePalette(biome)
    const w = FRAME_SIZE * scale
    const h = FRAME_SIZE * scale
    const buf = Buffer.alloc(w * h * 4)
    renderFrame(buf, w, tree.pixels, 0, scale, palette)

    const fileName = `tree_${treeIdx}_${biome.toLowerCase()}.png`
    const size = writePng(join(outDir, fileName), w, h, buf)
    manifest.trees.push({ file: fileName, tree: treeIdx, biome, width: w, height: h, bytes: size })
    console.log(`  ${fileName} (${w}×${h}, ${size} bytes)`)
  }
}

// Write manifest for the page to read
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nManifest: ${join(outDir, 'manifest.json')}`)
console.log('Done!')
