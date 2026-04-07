import type { Game, GameObjectPlayer, PlayerService } from '../types'
import { getDateMinusMinutes } from '#shared/utils/date'
import { TargetPoint } from '../objects/targetPoint'
import { PlayerObject } from '../objects/unit/playerObject'
import { MoveOffScreenAndSelfDestroyScript } from '../scripts/moveOffScreenAndSelfDestroyScript'
import { MoveToTargetScript } from '../scripts/moveToTargetScript'
import { MoveToTreeAndChopScript } from '../scripts/moveToTreeAndChopScript'

export class GamePlayerService implements PlayerService {
  constructor(readonly game: Game) {}

  update() {
    this.removeInactivePlayers()
  }

  async init(id: string, name: string, codename?: string | null, level?: number) {
    const player = await this.findOrCreatePlayer(id, name, codename, level)

    player.updateLastActionAt()

    // Don't reassign if player already has a task
    if (!player.script) {
      const tree = this.game.wagonService.getAvailableObstacle()
      if (tree) {
        player.script = new MoveToTreeAndChopScript({
          object: player,
          target: tree,
        })
      } else {
        const point = this.game.wagonService.getRandomNearPoint()
        const target = new TargetPoint(point.x, point.y)
        player.script = new MoveToTargetScript({
          object: player,
          target,
        })
      }
    }

    return player
  }

  get activePlayers() {
    return this.game.children.filter(
      (obj) => obj.type === 'PLAYER' && !obj.destroyed,
    ) as GameObjectPlayer[]
  }

  private async findOrCreatePlayer(
    id: string,
    name: string,
    codename?: string | null,
    level?: number,
  ): Promise<GameObjectPlayer> {
    const player = this.findPlayer(id)
    if (!player) {
      return this.createPlayer({ id, name, level }, codename)
    }

    return player
  }

  private findPlayer(id: string) {
    return this.game.children.find(
      (p) => p.id === id && p.type === 'PLAYER',
    ) as PlayerObject | undefined
  }

  private async createPlayer(player: { id: string, name: string, level?: number }, codename?: string | null) {
    const playerObj = new PlayerObject({
      game: this.game,
      id: player.id,
      x: -200,
      y: 0,
    })
    await playerObj.initVisual(codename)
    playerObj.initName(player.name, player.level)

    const spawnPoint = this.game.wagonService.getOffScreenPoint()
    playerObj.x = spawnPoint.x
    playerObj.y = spawnPoint.y

    return playerObj
  }

  private removeInactivePlayers() {
    for (const player of this.activePlayers) {
      const checkTime = getDateMinusMinutes(20)
      if (player.lastActionAt.getTime() <= checkTime.getTime()) {
        if (player.script) {
          continue
        }

        const exitPoint = this.game.wagonService.getOffScreenPoint()
        const target = new TargetPoint(exitPoint.x, exitPoint.y)
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
