/**
 * Audit all characters: find non-palette colors and show what they snap to.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'

const scriptDir = new URL('.', import.meta.url).pathname
const pkgDir = join(scriptDir, '..')
const unitsDir = join(pkgDir, 'references/units')

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
const PALETTE_SET = new Set(Object.values(PALETTE))
const entries = Object.entries(PALETTE)

function decodePNG(filePath) {
  const buf = readFileSync(filePath)
  let width, height, colorType
  const idatChunks = []
  let pos = 8
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idatChunks))
  const bpp = colorType === 6 ? 4 : 3
  const stride = width * bpp
  const pixels = new Uint8Array(width * height * 4)
  let rawPos = 0
  const prevRow = new Uint8Array(stride); const currRow = new Uint8Array(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++]
    for (let i = 0; i < stride; i++) {
      currRow[i] = raw[rawPos++]
    }
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? currRow[i - bpp] : 0; const b = prevRow[i]; const c = i >= bpp ? prevRow[i - bpp] : 0
      switch (filter) {
        case 0: break; case 1: currRow[i] = (currRow[i] + a) & 0xFF; break
        case 2: currRow[i] = (currRow[i] + b) & 0xFF; break
        case 3: currRow[i] = (currRow[i] + Math.floor((a + b) / 2)) & 0xFF; break
        case 4: { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); currRow[i] = (currRow[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xFF; break }
      }
    }
    for (let x = 0; x < width; x++) {
      const si = x * bpp; const di = (y * width + x) * 4
      pixels[di] = currRow[si]; pixels[di + 1] = currRow[si + 1]; pixels[di + 2] = currRow[si + 2]; pixels[di + 3] = bpp === 4 ? currRow[si + 3] : 255
    }
    prevRow.set(currRow)
  }
  return { width, height, pixels }
}

function snap(c) {
  const r = (c >> 16) & 0xFF; const g = (c >> 8) & 0xFF; const b = c & 0xFF
  let best = ''; let bestDist = Infinity
  for (const [name, pc] of entries) {
    const pr = (pc >> 16) & 0xFF; const pg = (pc >> 8) & 0xFF; const pb = pc & 0xFF
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (dist < bestDist) {
      bestDist = dist; best = name
    }
  }
  return { name: best, dist: Math.round(Math.sqrt(bestDist)) }
}

// Find collisions: two different original colors snapping to same palette color
function findCollisions(colorMap) {
  const bySnap = new Map() // palette name → [original colors]
  for (const [c, info] of colorMap) {
    const key = info.snapName
    if (!bySnap.has(key)) {
      bySnap.set(key, [])
    }
    bySnap.get(key).push({ color: c, count: info.count, dist: info.dist })
  }
  const collisions = []
  for (const [name, originals] of bySnap) {
    if (originals.length > 1) {
      collisions.push({ paletteName: name, originals })
    }
  }
  return collisions
}

const codenames = readdirSync(unitsDir).filter((d) => {
  try {
    return readFileSync(join(unitsDir, d, 'idle.png'))
  } catch {
    return false
  }
})

let totalIssues = 0

for (const codename of codenames.sort()) {
  const img = decodePNG(join(unitsDir, codename, 'idle.png'))
  const colors = new Map()
  for (let i = 0; i < img.width * img.height; i++) {
    const r = img.pixels[i * 4]; const g = img.pixels[i * 4 + 1]; const b = img.pixels[i * 4 + 2]; const a = img.pixels[i * 4 + 3]
    if (a < 128) {
      continue
    }
    const c = (r << 16) | (g << 8) | b
    if (!colors.has(c)) {
      const inPalette = PALETTE_SET.has(c)
      const s = snap(c)
      colors.set(c, { count: 0, inPalette, snapName: s.name, dist: s.dist })
    }
    colors.get(c).count++
  }

  const nonPalette = [...colors.entries()].filter(([,v]) => !v.inPalette)
  const collisions = findCollisions(colors)

  if (nonPalette.length === 0 && collisions.length === 0) {
    console.log(`✓ ${codename}`)
    continue
  }

  console.log(`\n✗ ${codename}:`)

  if (nonPalette.length) {
    console.log(`  Non-palette colors (${nonPalette.length}):`)
    for (const [c, info] of nonPalette.sort((a, b) => b[1].count - a[1].count)) {
      console.log(`    0x${c.toString(16).padStart(6, '0')} (${info.count}px) → ${info.snapName} dist=${info.dist}`)
    }
  }

  if (collisions.length) {
    console.log(`  Collisions (different colors → same slot):`)
    for (const col of collisions) {
      const details = col.originals.map((o) => `0x${o.color.toString(16).padStart(6, '0')}(${o.count}px,d=${o.dist})`).join(' + ')
      console.log(`    ${col.paletteName} ← ${details}`)
      totalIssues++
    }
  }
}

console.log(`\nTotal collision issues: ${totalIssues}`)
