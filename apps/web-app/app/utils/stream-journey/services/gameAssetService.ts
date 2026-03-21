import type { AssetService, Game, GameUnitAnimationAlias, GameUnitAnimations, GameUnitAnimationType, GameUnitCodename } from '../types'
import { AnimatedSprite, Assets, Sprite } from 'pixi.js'

export class GameAssetService implements AssetService {
  private baseUrl = 'https://chatgame.space/static/stream-journey/assets'

  private wagon = [
    { alias: 'WAGON_BASE_1', src: `${this.baseUrl}/objects/wagon/wagon-1.png` },
    { alias: 'WAGON_BASE_2', src: `${this.baseUrl}/objects/wagon/wagon-2.png` },
    { alias: 'WAGON_ENGINE', src: `${this.baseUrl}/objects/wagon/engine-1.png` },
    { alias: 'WAGON_WHEEL', src: `${this.baseUrl}/objects/wagon/wheel-1.png` },
    { alias: 'WAGON_ENGINE_CLOUD_1', src: `${this.baseUrl}/objects/wagon/clouds/1.png` },
    { alias: 'WAGON_ENGINE_CLOUD_2', src: `${this.baseUrl}/objects/wagon/clouds/2.png` },
    { alias: 'WAGON_ENGINE_CLOUD_3', src: `${this.baseUrl}/objects/wagon/clouds/3.png` },
    { alias: 'WAGON_ENGINE_CLOUD_4', src: `${this.baseUrl}/objects/wagon/clouds/4.png` },
  ]

  private units: Map<GameUnitCodename, GameUnitAnimations>

  constructor(protected game: Game) {
    this.units = new Map()

    const codenames: GameUnitCodename[] = [
      'twitchy', 'telegramo', 'banana', 'burger', 'catchy', 'claw',
      'gentleman', 'marshmallow', 'pioneer', 'pup', 'santa', 'shape',
      'sharky', 'woody', 'wooly',
    ]
    for (const codename of codenames) {
      this.addUnit(codename)
    }
  }

  getSprite(alias: string) {
    return Sprite.from(alias)
  }

  async getAnimatedSprite(codename: GameUnitCodename, type: GameUnitAnimationType): Promise<AnimatedSprite> {
    const unit = this.units.get(codename) ?? this.units.get('twitchy') as GameUnitAnimations

    return this.loadAnimation(unit![type])
  }

  async init() {
    await Assets.load(this.wagon)
  }

  private addUnit(codename: GameUnitCodename) {
    this.units.set(codename, {
      idle: {
        alias: `units.${codename}.idle`,
        src: `${this.baseUrl}/units/${codename}/idle.json`,
      },
      moving: {
        alias: `units.${codename}.moving`,
        src: `${this.baseUrl}/units/${codename}/moving.json`,
      },
    })
  }

  private async loadAnimation(sheet: { alias: GameUnitAnimationAlias, src: string }) {
    // Let PixiJS handle spritesheet loading natively
    const spritesheet = await Assets.load(sheet.src)

    const frames = spritesheet.animations[sheet.alias]
    if (!frames?.length) {
      throw new Error(`No frames for "${sheet.alias}"`)
    }

    const sprite = new AnimatedSprite(frames)
    sprite.texture.source.scaleMode = 'nearest'
    sprite.anchor.set(0.5, 1)
    sprite.scale.set(4)

    return sprite
  }
}
