import type {
  Game,
  GameObject,
  GameObjectUnit,
} from '../../types'
import { getRandInteger } from '#shared/utils/random'
import { createUnitFrames } from '@chatgame/sprites'
import { createId } from '@paralleldrive/cuid2'
import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { BaseObject } from '../baseObject'
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
  protected _idleFrames: Sprite[] = []
  protected _movingFrames: Sprite[] = []
  private _currentFrameIndex = 0
  private _animationTick = 0
  private _lastState: string = ''

  constructor({ game, x, y, id, type }: UnitObjectOptions) {
    super({ game, x, y, id, type })

    this._idleFrames = []
    this._movingFrames = []
    this._currentFrameIndex = 0
    this._animationTick = 0
    this._lastState = ''

    this.coins = 0
    this.state = 'IDLE'

    this.zIndex = Math.round(this.y + 1)

    this.dialogue = {
      messages: [],
    }

    this.initInterfaces()
  }

  override live() {
    super.live()

    this.handleMessages()

    if (this.script) {
      return this.script.live()
    }
  }

  async initVisual(codename: string | undefined | null, palette?: number[]): Promise<void> {
    // Clean up old frames
    if (this._idleFrames?.length) {
      for (const f of this._idleFrames) {
        this.removeChild(f)
      }
    }
    if (this._movingFrames?.length) {
      for (const f of this._movingFrames) {
        this.removeChild(f)
      }
    }
    this._idleFrames = []
    this._movingFrames = []
    this._currentFrameIndex = 0
    this._animationTick = 0

    const name = codename || 'twitchy'

    const idleGraphics = createUnitFrames(name, 'idle', palette)
    const movingGraphics = createUnitFrames(name, 'moving', palette)

    // Bake Graphics into textures, then use Sprites (no per-frame redraw)
    const bakeFrames = (graphics: Graphics[]) => graphics.map((g) => {
      const bounds = g.getLocalBounds()
      const texture = this.game.app.renderer.generateTexture({
        target: g,
        textureSourceOptions: { scaleMode: 'nearest' },
      })
      g.destroy()
      const sprite = new Sprite(texture)
      // Preserve original pivot (16, 32) relative to texture offset
      sprite.pivot.set(16 - bounds.x, 32 - bounds.y)
      return sprite
    })

    this._idleFrames = bakeFrames(idleGraphics)
    this._movingFrames = bakeFrames(movingGraphics)

    // Setup all frames: hidden, scaled
    for (const f of [...this._idleFrames, ...this._movingFrames]) {
      f.visible = false
      f.scale.set(4)
      this.addChild(f)
    }

    // Show first idle frame immediately
    if (this._idleFrames[0]) {
      this._idleFrames[0].visible = true
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
    if (!this._idleFrames?.length || !this._movingFrames?.length) {
      return
    }

    super.animate()

    // Reset frame index on state change
    if (this.state !== this._lastState) {
      this._currentFrameIndex = 0
      this._animationTick = 0
      this._lastState = this.state
    }

    this._animationTick++

    const isMoving = this.state === 'MOVING'
    const activeFrames = isMoving ? this._movingFrames : this._idleFrames
    const inactiveFrames = isMoving ? this._idleFrames : this._movingFrames
    const speed = isMoving ? 10 : 20 // ticks per frame

    // Hide inactive
    for (const f of inactiveFrames) {
      f.visible = false
    }

    // Advance animation
    if (this._animationTick % speed === 0) {
      this._currentFrameIndex = (this._currentFrameIndex + 1) % activeFrames.length
    }

    // Show current frame
    const flipX = isMoving
      ? (this.direction === 'RIGHT' ? 4 : -4)
      : (this.direction === 'LEFT' ? 4 : -4)

    for (let i = 0; i < activeFrames.length; i++) {
      const f = activeFrames[i]!
      f.visible = i === this._currentFrameIndex
      f.scale.x = flipX
    }

    this.dialogueInterface.animate()
  }

  drawUserName(name: string, level = 1) {
    if (!name) {
      return
    }

    const formattedText = name.trim().slice(0, 18)

    const container = new Container()

    // Level badge
    const badge = this.createLevelBadge(level)
    container.addChild(badge)

    const basicText = new Text({
      text: formattedText,
      style: {
        fontFamily: 'monospace',
        fontSize: 19,
        fontWeight: '700',
        fill: '#ffffff',
        stroke: {
          color: '#2e222f',
          width: 4,
          alignment: 0,
        },
        align: 'center',
      },
    })

    basicText.x = badge.width + 4
    badge.y = (basicText.height - badge.height) / 2 + 2
    container.addChild(basicText)

    container.x = -container.width / 2
    container.y = 0

    this.addChild(container)
  }

  private createLevelBadge(level: number): Container {
    const badge = new Container()

    const text = new Text({
      text: `${level}`,
      style: {
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: '900',
        fill: '#ffffff',
        align: 'center',
      },
    })

    const padX = 6
    const padY = 3
    const w = text.width + padX * 2
    const h = text.height + padY * 2

    const bg = new Graphics()
    bg.roundRect(0, 0, w, h, 4)
    bg.fill(0x905EA9)
    bg.stroke({ color: 0x45293F, width: 2 })
    badge.addChild(bg)

    text.x = padX
    text.y = padY
    badge.addChild(text)

    return badge
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
