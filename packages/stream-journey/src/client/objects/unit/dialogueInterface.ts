import type { GameObjectUnit } from './../../../types'
import { Container, Graphics, Text } from 'pixi.js'

export class DialogueInterface extends Container {
  messages: { id: string, text: string, isShowed: boolean }[]

  private showingSpeed: number

  constructor(readonly unit: GameObjectUnit) {
    super()

    this.messages = []
    this.showingSpeed = 0.05

    this.x = 0
    this.y = -36
  }

  create(message: { id: string, text: string }) {
    const container = new Container()

    const basicText = new Text({
      text: message.text,
      style: {
        fontFamily: 'Noto Serif',
        fontSize: 16,
        fontWeight: '500',
        fill: 0x451A03,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: 350,
      },
    })

    const rectOffsetX = 8
    const rectOffsetY = 4
    const rectWidth = basicText.width + rectOffsetX * 2
    const rectHeight = basicText.height + rectOffsetY * 2

    const graphics = new Graphics()
    graphics.rect(-rectOffsetX, -rectOffsetY, rectWidth, rectHeight)
    graphics.fill(0xFEF3C7)

    container.addChild(graphics, basicText)

    container.x = -container.width / 2 + 12
    container.y = -container.height - 82

    this.addChild(container)
  }

  animate() {
    this.visible = true
    this.zIndex = 0

    // Add new messages to show
    if (this.unit?.dialogue?.messages) {
      for (const message of this.unit.dialogue.messages) {
        const existed = this.messages.find((m) => m.id === message.id)
        if (!existed) {
          this.messages.push({ ...message, isShowed: false })
        }
      }
    }

    // If no active - create new show block!
    const needToShowMessages = this.messages.filter((m) => !m.isShowed)
    if (needToShowMessages.length > 0 && this.children.length <= 0) {
      const message = needToShowMessages[0]
      if (message) {
        this.create(message)

        message.isShowed = true
        this.showingSpeed = this.getShowingSpeed(message.text.length)
      }
    }

    for (const container of this.children) {
      container.visible = true
      container.zIndex = 0
      container.alpha -= this.showingSpeed

      if (container.alpha <= 0.8) {
        this.remove(container)
      }
    }
  }

  private remove(container: Container) {
    return this.removeChild(container)
  }

  private getShowingSpeed(messageLength: number) {
    return (0.05 - (messageLength * 4) / 10000) / this.unit.game.tick
  }
}
