import { Container, Graphics } from 'pixi.js'

import { ANCHORS, TREES } from '../data/treeSpriteData'
import { PALETTE } from '../palette'

export type BiomeType = 'GREEN' | 'BLUE' | 'STONE' | 'TEAL' | 'TOXIC' | 'VIOLET'

interface ProceduralTreeOptions {
  size?: number
  variant?: number
  biome?: BiomeType
}

const P = PALETTE

// Leaf color mappings for biomes: [darkGreen, green1, green2, lightGreen, paleGreen]
const BIOME_COLORS: Record<string, [number, number, number, number, number]> = {
  GREEN: [P.darkGreen, P.green1, P.green2, P.lightGreen, P.paleGreen],
  BLUE: [P.darkBlue, P.blue1, P.blue2, P.blue3, P.lightBlue],
  STONE: [P.darkGray, P.grayGreen1, P.grayGreen2, P.grayGreen3, P.grayGreen4],
  TEAL: [P.darkTeal, P.teal1, P.teal2, P.teal3, P.paleTeal],
  TOXIC: [P.darkBrown, P.olive, P.yellowGreen, P.lime, P.paleYellow],
  VIOLET: [P.darkViolet, P.violet1, P.violet2, P.violet3, P.paleViolet],
}

// Source green colors to remap
const GREEN_COLORS = BIOME_COLORS.GREEN!

function remapColor(color: number, biome: string): number {
  if (biome === 'GREEN') {
    return color
  }
  const target = BIOME_COLORS[biome]
  if (!target) {
    return color
  }
  const idx = GREEN_COLORS.indexOf(color)
  if (idx !== -1) {
    return target[idx]!
  }
  return color
}

export function createProceduralTree(options: ProceduralTreeOptions = {}): Container {
  const { size = 4, variant, biome = 'GREEN' } = options
  const tree = new Container()
  const g = new Graphics()

  const index = variant ?? Math.floor(Math.random() * TREES.length)
  const treeIndex = index % TREES.length
  const data = TREES[treeIndex]!
  const anchor = ANCHORS[treeIndex]!

  for (const [x, y, color] of data) {
    g.rect(x, y, 1, 1).fill(remapColor(color, biome))
  }

  tree.addChild(g)
  g.x = -anchor[0]!
  g.y = -(anchor[1]! + 1)
  tree.scale.set(size)

  return tree
}
