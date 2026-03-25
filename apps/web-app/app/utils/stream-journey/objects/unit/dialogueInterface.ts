import type { GameObjectUnit } from '../../types'
import { Container, Graphics, Text } from 'pixi.js'
import { PALETTE } from '../../palette'

export class DialogueInterface extends Container {
  messages: { id: string, text: string, isShowed: boolean }[]

  private frameCount = 0
  private readonly SHOW_FRAMES = 360 // ~6 sec at 60fps

  constructor(readonly unit: GameObjectUnit) {
    super()

    this.messages = []

    this.x = 0
    this.y = -36

    this.zIndex = 10
    this.visible = true
  }

  create(message: { id: string, text: string }) {
    const formattedText = message.text.trim().slice(0, 60)

    const basicText = new Text({
      text: formattedText,
      style: {
        fontFamily: 'monospace',
        fontSize: 22,
        fontWeight: '600',
        fill: '#ffffff',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 250,
      },
    })

    const paddingX = 10
    const paddingY = 6
    const totalW = basicText.width + paddingX * 2
    const totalH = basicText.height + paddingY * 2

    const bg = new Graphics()
      .roundRect(0, 0, totalW, totalH, 6)
      .fill({ color: PALETTE.darkPurple, alpha: 0.9 })

    // Triangle pointer
    const triSize = 6
    bg.moveTo(totalW / 2 - triSize, totalH)
      .lineTo(totalW / 2, totalH + triSize)
      .lineTo(totalW / 2 + triSize, totalH)
      .fill({ color: PALETTE.darkPurple, alpha: 0.9 })

    const container = new Container()
    container.addChild(bg)
    basicText.x = paddingX
    basicText.y = paddingY
    container.addChild(basicText)

    container.x = -totalW / 2
    container.y = -totalH - 80

    this.frameCount = 0
    this.addChild(container)
  }

  animate() {
    if (this.unit?.dialogue?.messages) {
      for (const message of this.unit.dialogue.messages) {
        const existed = this.messages.find((m) => m.id === message.id)
        if (!existed) {
          this.messages.push({ ...message, isShowed: false })
        }
      }
    }

    const needToShowMessages = this.messages.filter((m) => !m.isShowed)
    if (needToShowMessages.length > 0 && this.children.length <= 0) {
      const message = needToShowMessages[0]
      if (message) {
        this.create(message)
        message.isShowed = true
      }
    }

    for (const container of [...this.children]) {
      this.frameCount++

      // Slow float up
      container.y -= 0.15

      // Fade out in last 60 frames
      const fadeStart = this.SHOW_FRAMES - 60
      if (this.frameCount > fadeStart) {
        container.alpha = Math.max(0, 1 - (this.frameCount - fadeStart) / 60)
      }

      if (this.frameCount >= this.SHOW_FRAMES) {
        this.removeChild(container)
      }
    }
  }
}
