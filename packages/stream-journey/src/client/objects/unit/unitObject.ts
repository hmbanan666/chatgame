import type { AnimatedSprite } from 'pixi.js'
import type {
  Game,
  GameObject,
  GameObjectUnit,
  GameUnitAnimationAlias,
} from './../../../types'
import { createId } from '@paralleldrive/cuid2'
import { Container, Text } from 'pixi.js'
import { BaseObject } from '../baseObject'
import { getRandInteger } from './../../utils/random'
import { DialogueInterface } from './dialogueInterface'

interface UnitObjectOptions {
  game: Game
  id?: string
  x: number
  y: number
  type: GameObject['type']
}

export class UnitObject extends BaseObject implements GameObjectUnit {
  override name!: GameObjectUnit['name']
  visual!: GameObjectUnit['visual']
  coins = 0
  dialogue: GameObjectUnit['dialogue']

  private dialogueInterface!: DialogueInterface
  private animationIdle!: AnimatedSprite | undefined
  private animationMoving!: AnimatedSprite | undefined

  constructor({ game, x, y, id, type }: UnitObjectOptions) {
    super({ game, x, y, id, type })

    this.coins = 0
    this.state = 'IDLE'

    this.zIndex = Math.round(this.y + 1)

    this.dialogue = {
      messages: [],
    }

    this.initInterfaces()
  }

  override live() {
    this.handleMessages()

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
      this.animationIdle = await this.game.assetService.getAnimatedSprite(`units.${codename}.idle` as GameUnitAnimationAlias)
      this.addChild(this.animationIdle)
    } catch (error) {
      console.error('Error loading idle animation:', error)
    }

    try {
      this.animationMoving = await this.game.assetService.getAnimatedSprite(`units.${codename}.moving` as GameUnitAnimationAlias)
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

      if (this.direction === 'LEFT') {
        this.animationIdle.scale.x = 4
        this.animationIdle.play()
      }
      if (this.direction === 'RIGHT') {
        this.animationIdle.scale.x = -4
        this.animationIdle.play()
      }
    }

    this.dialogueInterface.animate()
  }

  drawUserName(name: string) {
    if (!name) {
      return
    }

    const formattedText = name.trim().slice(0, 18)

    const container = new Container()

    const basicText = new Text({
      text: formattedText,
      style: {
        fontFamily: 'Noto Serif',
        fontSize: 26,
        fontWeight: '600',
        fill: '#ffffff',
        stroke: {
          color: '#2e222f',
          width: 6,
          alignment: 0,
        },
        align: 'center',
      },
    })

    container.addChild(basicText)

    const containerHalfWidth = container.width / 2 - 8
    container.x = -containerHalfWidth
    container.y = -140

    this.addChild(container)
  }

  private initInterfaces() {
    this.dialogueInterface = new DialogueInterface(this)
    this.addChild(this.dialogueInterface)
  }

  private handleMessages() {
    const random = getRandInteger(1, 200)
    if (random === 1) {
      this.dialogue?.messages?.splice(0, 1)
    }
  }
}
