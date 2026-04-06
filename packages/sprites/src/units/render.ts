import { Graphics } from 'pixi.js'

import * as banana from './data/banana'
import * as burger from './data/burger'
import * as catchy from './data/catchy'
import * as claw from './data/claw'
import * as gentleman from './data/gentleman'
import * as marshmallow from './data/marshmallow'
import * as pioneer from './data/pioneer'
import * as pup from './data/pup'
import * as santa from './data/santa'
import * as shape from './data/shape'
import * as sharky from './data/sharky'
import * as telegramo from './data/telegramo'
import * as twitchy from './data/twitchy'
import * as villager from './data/villager'
import * as woody from './data/woody'
import * as wooly from './data/wooly'

interface UnitSpriteData {
  FRAME_SIZE: number
  IDLE_FRAMES: [number, number, number][][]
  MOVING_FRAMES: [number, number, number][][]
  DEFAULT_PALETTE: number[]
}

const UNITS: Record<string, UnitSpriteData> = {
  banana, burger, catchy, claw, gentleman,
  marshmallow, pioneer, pup, santa, shape,
  sharky, telegramo, twitchy, villager, woody, wooly,
}

/** Render a single frame of indexed pixel data onto a Graphics object */
export function renderFrame(g: Graphics, frameData: [number, number, number][], palette: number[]): void {
  g.clear()
  for (const [x, y, slot] of frameData) {
    g.rect(x, y, 1, 1).fill(palette[slot]!)
  }
}

/** Get unit sprite data by codename */
export function getUnitData(codename: string): UnitSpriteData {
  return UNITS[codename] ?? UNITS.twitchy!
}

/** Create Graphics frames for a unit animation (idle or moving) */
export function createUnitFrames(
  codename: string,
  type: 'idle' | 'moving',
  palette?: number[],
): Graphics[] {
  const data = getUnitData(codename)
  const pal = palette ?? data.DEFAULT_PALETTE
  const frames = type === 'idle' ? data.IDLE_FRAMES : data.MOVING_FRAMES

  return frames.map((frameData) => {
    const g = new Graphics()
    for (const [x, y, slot] of frameData) {
      g.rect(x, y, 1, 1).fill(pal[slot]!)
    }
    return g
  })
}
