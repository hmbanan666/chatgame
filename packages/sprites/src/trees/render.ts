import { Container, Graphics } from 'pixi.js'

import { ANCHORS, getTreePalette, TREES } from './data'

export type BiomeType = 'GREEN' | 'BLUE' | 'STONE' | 'TEAL' | 'TOXIC' | 'VIOLET'

interface ProceduralTreeOptions {
  size?: number
  variant?: number
  biome?: BiomeType
}

export function createProceduralTree(options: ProceduralTreeOptions = {}): Container {
  const { size = 4, variant, biome = 'GREEN' } = options
  const tree = new Container()
  const g = new Graphics()

  const index = variant ?? Math.floor(Math.random() * TREES.length)
  const treeIndex = index % TREES.length
  const data = TREES[treeIndex]!
  const anchor = ANCHORS[treeIndex]!
  const palette = getTreePalette(biome)

  for (const [x, y, slot] of data) {
    g.rect(x, y, 1, 1).fill(palette[slot]!)
  }

  tree.addChild(g)
  g.x = -anchor[0]!
  g.y = -(anchor[1]! + 1)
  tree.scale.set(size)

  return tree
}
