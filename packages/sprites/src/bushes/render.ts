import { Container, Graphics } from 'pixi.js'

import { ANCHORS, BUSHES, getBushPalette } from './data'

interface BushOptions {
  variant?: number
  biome?: string
}

export function createBush(options: BushOptions = {}): Container {
  const { variant, biome = 'GREEN' } = options
  const bush = new Container()
  const g = new Graphics()
  const palette = getBushPalette(biome)

  const index = variant ?? Math.floor(Math.random() * BUSHES.length)
  const bushIndex = index % BUSHES.length
  const data = BUSHES[bushIndex]!
  const anchor = ANCHORS[bushIndex]!

  for (const [x, y, slot] of data) {
    g.rect(x, y, 1, 1).fill(palette[slot]!)
  }

  g.x = -anchor[0]!
  g.y = -(anchor[1]! + 1)

  bush.addChild(g)
  bush.scale.set(3)

  return bush
}
