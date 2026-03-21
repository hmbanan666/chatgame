import type { BiomeType } from './proceduralTree'
import { Container, Graphics } from 'pixi.js'
import { PALETTE } from '../palette'
import { getRandInteger } from '../utils/random'

const P = PALETTE

interface BiomeColors {
  dark: number
  mid: number
  bright: number
  light: number
  pale: number
  accent1: number
  accent2: number
}

const BIOME_BUSH_COLORS: Record<BiomeType, BiomeColors> = {
  GREEN: { dark: P.darkGreen, mid: P.green1, bright: P.green2, light: P.lightGreen, pale: P.paleGreen, accent1: P.brightRed, accent2: P.yellow1 },
  BLUE: { dark: P.darkBlue, mid: P.blue1, bright: P.blue2, light: P.blue3, pale: P.lightBlue, accent1: P.lightBlue, accent2: P.white },
  STONE: { dark: P.darkGray, mid: P.grayGreen1, bright: P.grayGreen2, light: P.grayGreen3, pale: P.grayGreen4, accent1: P.mauve, accent2: P.tan },
  TEAL: { dark: P.darkTeal, mid: P.teal1, bright: P.teal2, light: P.teal3, pale: P.paleTeal, accent1: P.teal3, accent2: P.paleTeal },
  TOXIC: { dark: P.darkBrown, mid: P.olive, bright: P.yellowGreen, light: P.lime, pale: P.paleYellow, accent1: P.lime, accent2: P.paleYellow },
  VIOLET: { dark: P.darkViolet, mid: P.violet1, bright: P.violet2, light: P.violet3, pale: P.paleViolet, accent1: P.pink2, accent2: P.paleViolet },
}

type DrawFn = (g: Graphics, c: BiomeColors) => void

// Mushroom patch
function drawBush1(g: Graphics, c: BiomeColors) {
  g.rect(1, 0, 3, 1).fill(c.bright)
  g.rect(0, 1, 5, 1).fill(c.light)
  g.rect(2, 2, 1, 2).fill(c.pale)
  g.rect(5, 1, 2, 1).fill(c.bright)
  g.rect(4, 2, 4, 1).fill(c.light)
  g.rect(6, 3, 1, 1).fill(c.pale)
  g.rect(0, 3, 3, 1).fill(c.mid)
  g.rect(3, 3, 2, 1).fill(c.dark)
  g.rect(7, 3, 1, 1).fill(c.mid)
}

// Wide flat bush
function drawBush2(g: Graphics, c: BiomeColors) {
  g.rect(3, 0, 4, 1).fill(c.dark)
  g.rect(1, 1, 8, 1).fill(c.mid)
  g.rect(0, 2, 10, 1).fill(c.bright)
  g.rect(0, 3, 10, 1).fill(c.mid)
  g.rect(1, 4, 8, 1).fill(c.dark)
  g.rect(2, 1, 3, 1).fill(c.bright)
  g.rect(4, 2, 3, 1).fill(c.light)
  g.rect(2, 2, 1, 1).fill(c.light)
  g.rect(6, 3, 2, 1).fill(c.bright)
}

// Bush with berries/accents
function drawBush3(g: Graphics, c: BiomeColors) {
  g.rect(2, 0, 4, 1).fill(c.dark)
  g.rect(1, 1, 6, 1).fill(c.mid)
  g.rect(0, 2, 8, 1).fill(c.bright)
  g.rect(0, 3, 8, 1).fill(c.mid)
  g.rect(1, 4, 6, 1).fill(c.dark)
  g.rect(2, 1, 2, 1).fill(c.light)
  g.rect(3, 2, 2, 1).fill(c.light)
  g.rect(2, 2, 1, 1).fill(c.accent1)
  g.rect(5, 1, 1, 1).fill(c.accent1)
  g.rect(6, 3, 1, 1).fill(c.accent2)
}

// Tall grass tuft
function drawBush4(g: Graphics, c: BiomeColors) {
  g.rect(1, 0, 1, 1).fill(c.bright)
  g.rect(3, 0, 1, 1).fill(c.light)
  g.rect(5, 0, 1, 1).fill(c.bright)
  g.rect(0, 1, 1, 1).fill(c.mid)
  g.rect(2, 1, 1, 1).fill(c.light)
  g.rect(4, 1, 1, 1).fill(c.bright)
  g.rect(6, 1, 1, 1).fill(c.mid)
  g.rect(0, 2, 7, 1).fill(c.mid)
  g.rect(1, 3, 5, 1).fill(c.dark)
  g.rect(1, 2, 1, 1).fill(c.light)
  g.rect(3, 2, 1, 1).fill(c.pale)
  g.rect(5, 2, 1, 1).fill(c.light)
}

// Flower patch
function drawBush5(g: Graphics, c: BiomeColors) {
  g.rect(1, 0, 1, 1).fill(c.accent2)
  g.rect(4, 0, 1, 1).fill(c.accent1)
  g.rect(0, 1, 6, 1).fill(c.mid)
  g.rect(0, 2, 6, 1).fill(c.bright)
  g.rect(1, 3, 4, 1).fill(c.dark)
  g.rect(2, 1, 1, 1).fill(c.accent2)
  g.rect(5, 1, 1, 1).fill(c.accent1)
  g.rect(1, 2, 1, 1).fill(c.light)
  g.rect(3, 2, 1, 1).fill(c.light)
}

const BUSH_DRAWERS: DrawFn[] = [drawBush1, drawBush2, drawBush3, drawBush4, drawBush5]

const ANCHORS_X = [3, 5, 4, 3, 3]
const ANCHORS_Y = [4, 4, 4, 3, 3]

export function createBush(variant?: number, biome: BiomeType = 'GREEN'): Container {
  const bush = new Container()
  const g = new Graphics()
  const colors = BIOME_BUSH_COLORS[biome]

  const index = variant ?? getRandInteger(0, BUSH_DRAWERS.length - 1)
  const drawIndex = index % BUSH_DRAWERS.length

  BUSH_DRAWERS[drawIndex]!(g, colors)

  g.x = -ANCHORS_X[drawIndex]!
  g.y = -ANCHORS_Y[drawIndex]! - 1

  bush.addChild(g)
  bush.scale.set(3)

  return bush
}
