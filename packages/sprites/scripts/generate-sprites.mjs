/**
 * Generate PNG sprite sheets from indexed pixel data for static use (website, alerts).
 *
 * Usage: node scripts/generate-sprites.mjs [scale=4] [outDir]
 * Reads from:  src/units/data/*.ts
 * Writes to:   outDir (default: ../../apps/web-app/public/static/stream-journey/assets/units/)
 */

import { createWriteStream, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')

const scale = Number(process.argv[2]) || 4
const outDir = process.argv[3] || join(pkgDir, '../../apps/web-app/public/static/units')
const dataDir = join(pkgDir, 'src/units/data')

// Read palette for resolving colors
const paletteSrc = readFileSync(join(pkgDir, 'src/palette.ts'), 'utf-8')
const PALETTE = {}
const palRe = /(\w+):\s*(0x[0-9A-Fa-f]+)/g
let pm
while ((pm = palRe.exec(paletteSrc)) !== null) {
  PALETTE[pm[1]] = Number(pm[2])
}

// --- PNG encoder ---
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]; for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0)
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}
function writePng(filePath, width, height, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6
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
  createWriteStream(filePath).end(png)
  return png.length
}

// Parse indexed TS file
function parseDataFile(filePath) {
  const src = readFileSync(filePath, 'utf-8')

  // Extract DEFAULT_PALETTE
  const palMatch = src.match(/export const DEFAULT_PALETTE[^=]*=\s*\[([\s\S]*?)\]/)
  const palette = []
  if (palMatch) {
    const pr = /PALETTE\.(\w+)/g
    let m
    while ((m = pr.exec(palMatch[1])) !== null) {
      palette.push(PALETTE[m[1]])
    }
  }

  // Extract frame arrays
  const arrays = {}
  const nameRe = /export const (\w+):\s*\[number,\s*number,\s*number\]\[\]\s*=\s*\[/g
  let match
  while ((match = nameRe.exec(src)) !== null) {
    const name = match[1]
    const arrayStart = match.index + match[0].length
    let depth = 1; let end = arrayStart
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
    const pixels = []
    const lineRe = /\[(\d+),(\d+),(\d+)\]/g
    let m
    while ((m = lineRe.exec(body)) !== null) {
      pixels.push([Number(m[1]), Number(m[2]), Number(m[3])])
    }
    arrays[name] = pixels
  }

  const fsMatch = src.match(/FRAME_SIZE\s*=\s*(\d+)/)
  const frameSize = fsMatch ? Number(fsMatch[1]) : 32

  return { arrays, frameSize, palette }
}

function renderFrame(buf, totalWidth, frameData, offsetX, s, palette) {
  for (const [x, y, slot] of frameData) {
    const color = palette[slot]
    const r = (color >> 16) & 0xFF; const g = (color >> 8) & 0xFF; const b = color & 0xFF
    for (let dy = 0; dy < s; dy++) {
      for (let dx = 0; dx < s; dx++) {
        const px = offsetX + x * s + dx; const py = y * s + dy
        const i = (py * totalWidth + px) * 4
        buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255
      }
    }
  }
}

// Process each unit
const files = readdirSync(dataDir).filter((f) => f.endsWith('.ts'))
console.log(`Generating ${files.length} units at ${scale}x → ${outDir}\n`)

for (const file of files) {
  const codename = file.replace('.ts', '')
  const { arrays, frameSize, palette } = parseDataFile(join(dataDir, file))

  if (!palette.length) {
    console.log(`  ${codename}: no palette, skip`); continue
  }

  const idleFrames = Object.entries(arrays).filter(([n]) => n.startsWith('IDLE_')).sort(([a], [b]) => a.localeCompare(b))
  const movingFrames = Object.entries(arrays).filter(([n]) => n.startsWith('MOVING_')).sort(([a], [b]) => a.localeCompare(b))

  const unitOutDir = join(outDir, codename)
  mkdirSync(unitOutDir, { recursive: true })

  // Moving sprite sheet (used for CSS sprite animation on website)
  if (movingFrames.length) {
    const w = movingFrames.length * frameSize * scale; const h = frameSize * scale
    const buf = Buffer.alloc(w * h * 4)
    for (let i = 0; i < movingFrames.length; i++) {
      renderFrame(buf, w, movingFrames[i][1], i * frameSize * scale, scale, palette)
    }
    writePng(join(unitOutDir, 'moving.png'), w, h, buf)
  }

  // 128x128 static icon (first idle frame at 4x)
  if (idleFrames.length) {
    const w = frameSize * 4; const h = frameSize * 4
    const buf = Buffer.alloc(w * h * 4)
    renderFrame(buf, w, idleFrames[0][1], 0, 4, palette)
    writePng(join(unitOutDir, '128.png'), w, h, buf)
  }

  console.log(`  ${codename}: moving(${movingFrames.length}f) + 128.png`)
}

console.log('\nDone!')
