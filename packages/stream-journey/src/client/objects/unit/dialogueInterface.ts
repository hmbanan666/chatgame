import type { GameObjectUnit } from './../../../types'
import { Container, Text } from 'pixi.js'

export class DialogueInterface extends Container {
  messages: { id: string, text: string, isShowed: boolean }[]

  private showingSpeed: number

  constructor(readonly unit: GameObjectUnit) {
    super()

    this.messages = []
    this.showingSpeed = 0.05

    this.x = 0
    this.y = -36

    this.zIndex = 0
    this.visible = true
  }

  create(message: { id: string, text: string }) {
    const container = new Container()

    const formattedText = message.text.trim().slice(0, 500)

    const basicText = new Text({
      text: formattedText,
      style: {
        fontFamily: 'Noto Serif',
        fontSize: 18,
        fontWeight: '600',
        fill: '#ffffff',
        stroke: {
          color: '#2e222f',
          width: 5,
          alignment: 0,
        },
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 400,
      },
    })

    container.addChild(basicText)

    container.x = -container.width / 2 + 10
    container.y = -container.height - 86

    this.addChild(container)
  }

  animate() {
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
      container.y -= this.showingSpeed * 150

      if (container.alpha <= 0.85) {
        this.remove(container)
      }
    }
  }

  private remove(container: Container) {
    return this.removeChild(container)
  }

  private getShowingSpeed(_messageLength: number) {
    // const baseDuration = 2
    // const lengthFactor = 0.05

    // const calculated = (baseDuration + messageLength * lengthFactor) / 10000

    // It should be around 0.0005
    return 0.0005
  }
}
