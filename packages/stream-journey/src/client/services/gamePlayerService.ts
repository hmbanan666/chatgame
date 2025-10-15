import type { Game, GameObjectPlayer, PlayerService } from '../../types'
import { PlayerObject } from '../objects/unit/playerObject'
import { MoveOffScreenAndSelfDestroyScript } from '../scripts/moveOffScreenAndSelfDestroyScript'
import { MoveToTargetScript } from '../scripts/moveToTargetScript'
import { getDateMinusMinutes } from './../utils/date'

export class GamePlayerService implements PlayerService {
  constructor(readonly game: Game) {}

  update() {
    this.removeInactivePlayers()
  }

  async init(id: string, name: string, codename?: string | null) {
    const player = await this.findOrCreatePlayer(id, name, codename)

    player.updateLastActionAt()

    const target = this.game.wagonService.randomNearFlag

    player.script = new MoveToTargetScript({
      object: player,
      target,
    })

    return player
  }

  get activePlayers() {
    return this.game.children.filter(
      (obj) => obj.type === 'PLAYER',
    ) as GameObjectPlayer[]
  }

  private async findOrCreatePlayer(
    id: string,
    name: string,
    codename?: string | null,
  ): Promise<GameObjectPlayer> {
    const player = this.findPlayer(id)
    if (!player) {
      return this.createPlayer({ id, name }, codename)
    }

    return player
  }

  private findPlayer(id: string) {
    return this.game.children.find(
      (p) => p.id === id && p.type === 'PLAYER',
    ) as PlayerObject | undefined
  }

  private async createPlayer(player: { id: string, name: string }, codename?: string | null) {
    const playerObj = new PlayerObject({
      game: this.game,
      id: player.id,
      x: -200,
      y: 0,
    })
    await playerObj.initVisual(codename)
    playerObj.initName(player.name)

    const flag = this.game.wagonService.randomOutFlag
    playerObj.x = flag.x
    playerObj.y = flag.y

    return playerObj
  }

  private removeInactivePlayers() {
    for (const player of this.activePlayers) {
      const checkTime = getDateMinusMinutes(4)
      if (player.lastActionAt.getTime() <= checkTime.getTime()) {
        if (player.script) {
          continue
        }

        const target = this.game.wagonService.randomOutFlag
        const selfDestroyFunc = () => {
          player.state = 'DESTROYED'
        }

        player.script = new MoveOffScreenAndSelfDestroyScript({
          target,
          object: player,
          selfDestroyFunc,
        })
      }
    }
  }
}
