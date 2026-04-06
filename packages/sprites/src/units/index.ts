export * as banana from './data/banana'
export * as burger from './data/burger'
export * as catchy from './data/catchy'
export * as claw from './data/claw'
export * as gentleman from './data/gentleman'
export * as marshmallow from './data/marshmallow'
export * as pioneer from './data/pioneer'
export * as pup from './data/pup'
export * as santa from './data/santa'
export * as shape from './data/shape'
export * as sharky from './data/sharky'
export * as telegramo from './data/telegramo'
export * as twitchy from './data/twitchy'
export * as villager from './data/villager'
export * as woody from './data/woody'
export * as wooly from './data/wooly'

export const UNIT_CODENAMES = [
  'banana', 'burger', 'catchy', 'claw', 'gentleman',
  'marshmallow', 'pioneer', 'pup', 'santa', 'shape',
  'sharky', 'telegramo', 'twitchy', 'villager', 'woody', 'wooly',
] as const

export type UnitCodename = typeof UNIT_CODENAMES[number]

export { createUnitFrames, getUnitData, renderFrame } from './render'
