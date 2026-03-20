import type {
  GameAddon,
  GameObject,
  GameObjectUnit,
} from './../../types'
import { createId } from '@paralleldrive/cuid2'
import { AnimatedSprite, Assets } from 'pixi.js'
import { BaseObject } from '../baseObject'

interface UnitObjectOptions {
  addon: GameAddon
  id?: string
  x: number
  y: number
  type: GameObject['type']
}

export class UnitObject extends BaseObject implements GameObjectUnit {
  override name!: GameObjectUnit['name']
  visual!: GameObjectUnit['visual']
  dialogue: GameObjectUnit['dialogue']

  animationIdle!: AnimatedSprite | undefined
  animationMoving!: AnimatedSprite | undefined

  constructor({ addon, x, y, id, type }: UnitObjectOptions) {
    super({ addon, x, y, id, type })

    this.state = 'IDLE'

    this.dialogue = {
      messages: [],
    }
  }

  override live() {
    if (this.script) {
      return this.script.live()
    }
  }

  async initVisual(codename: string | undefined | null = 'twitchy'): Promise<void> {
    if (this.animationIdle) {
      this.removeChild(this.animationIdle)
      this.animationIdle = undefined
    }
    if (this.animationMoving) {
      this.removeChild(this.animationMoving)
      this.animationMoving = undefined
    }

    try {
      const idle = await Assets.load(`https://storage.yandexcloud.net/chatgame-assets/units/${codename}/idle.json`)
      const idleSprite = new AnimatedSprite(idle.animations.main)
      idleSprite.anchor.set(0.5, 1)
      idleSprite.scale.set(4)
      this.animationIdle = idleSprite
      this.addChild(this.animationIdle)
    } catch (error) {
      console.error('Error loading idle animation:', error)
    }

    try {
      const moving = await Assets.load(`https://storage.yandexcloud.net/chatgame-assets/units/${codename}/moving.json`)
      const movingSprite = new AnimatedSprite(moving.animations.main)
      movingSprite.anchor.set(0.5, 1)
      movingSprite.scale.set(4)
      this.animationMoving = movingSprite
      this.addChild(this.animationMoving)
    } catch (error) {
      console.error('Error loading moving animation:', error)
    }
  }

  addMessage(message: string): void {
    const MAX_CHARS = 100
    const messagePrepared = message.trim().slice(0, MAX_CHARS) + (message.length > MAX_CHARS ? '...' : '')

    this.dialogue.messages.push({
      id: createId(),
      text: messagePrepared,
    })
  }

  override animate() {
    if (
      !this.children?.length
      || !this.animationIdle
      || !this.animationMoving
    ) {
      return
    }

    super.animate()

    this.zIndex = 0

    if (this.state === 'MOVING') {
      this.animationIdle.visible = false
      this.animationMoving.animationSpeed = 0.1
      this.animationMoving.visible = true

      if (this.direction === 'RIGHT') {
        this.animationMoving.scale.x = 4
        this.animationMoving.play()
      }
      if (this.direction === 'LEFT') {
        this.animationMoving.scale.x = -4
        this.animationMoving.play()
      }
    }

    if (
      this.state === 'IDLE'
      || this.state === 'CHOPPING'
      || this.state === 'MINING'
    ) {
      this.animationMoving.animationSpeed = 0
      this.animationMoving.animationSpeed = 0
      this.animationMoving.currentFrame = 0
      this.animationMoving.currentFrame = 0
      this.animationMoving.visible = false

      this.animationIdle.animationSpeed = 0.05
      this.animationIdle.visible = true

      if (this.direction === 'RIGHT') {
        this.animationIdle.scale.x = 4
        this.animationIdle.play()
      }
      if (this.direction === 'LEFT') {
        this.animationIdle.scale.x = -4
        this.animationIdle.play()
      }
    }
  }
}
