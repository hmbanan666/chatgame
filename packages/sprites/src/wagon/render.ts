import { Container, Graphics } from 'pixi.js'

import {
  DEFAULT_PALETTE,
  WAGON_BASE_1, WAGON_BASE_1_SIZE,
  WAGON_BASE_2, WAGON_BASE_2_SIZE,
  WAGON_CHEST, WAGON_CHEST_SIZE,
  WAGON_CLOUD_1, WAGON_CLOUD_1_SIZE,
  WAGON_CLOUD_2, WAGON_CLOUD_2_SIZE,
  WAGON_CLOUD_3, WAGON_CLOUD_3_SIZE,
  WAGON_CLOUD_4, WAGON_CLOUD_4_SIZE,
  WAGON_ENGINE, WAGON_ENGINE_SIZE,
  WAGON_WHEEL, WAGON_WHEEL_SIZE,
} from './data'

function renderPart(data: [number, number, number][], palette: number[]): Graphics {
  const g = new Graphics()
  for (const [x, y, slot] of data) {
    g.rect(x, y, 1, 1).fill(palette[slot]!)
  }
  return g
}

/** Create a wagon part as a Container with Graphics inside, supporting anchor-like positioning */
function createPart(
  data: [number, number, number][],
  size: { w: number, h: number },
  palette: number[],
  anchorX = 0.5,
  anchorY = 1,
): Container {
  const container = new Container()
  const g = renderPart(data, palette)
  g.x = -size.w * anchorX
  g.y = -size.h * anchorY
  container.addChild(g)
  return container
}

export function createWagonBase1(palette?: number[]): Container {
  return createPart(WAGON_BASE_1, WAGON_BASE_1_SIZE, palette ?? DEFAULT_PALETTE)
}

export function createWagonBase2(palette?: number[]): Container {
  return createPart(WAGON_BASE_2, WAGON_BASE_2_SIZE, palette ?? DEFAULT_PALETTE)
}

export function createWagonEngine(palette?: number[]): Container {
  return createPart(WAGON_ENGINE, WAGON_ENGINE_SIZE, palette ?? DEFAULT_PALETTE)
}

export function createWagonWheel(palette?: number[]): Container {
  return createPart(WAGON_WHEEL, WAGON_WHEEL_SIZE, palette ?? DEFAULT_PALETTE, 0.5, 0.5)
}

export function createWagonChest(palette?: number[]): Container {
  return createPart(WAGON_CHEST, WAGON_CHEST_SIZE, palette ?? DEFAULT_PALETTE)
}

const CLOUD_DATA = [
  { data: WAGON_CLOUD_1, size: WAGON_CLOUD_1_SIZE },
  { data: WAGON_CLOUD_2, size: WAGON_CLOUD_2_SIZE },
  { data: WAGON_CLOUD_3, size: WAGON_CLOUD_3_SIZE },
  { data: WAGON_CLOUD_4, size: WAGON_CLOUD_4_SIZE },
]

export function createWagonCloud(index: number, palette?: number[]): Container {
  const cloud = CLOUD_DATA[index % CLOUD_DATA.length]!
  return createPart(cloud.data, cloud.size, palette ?? DEFAULT_PALETTE)
}
