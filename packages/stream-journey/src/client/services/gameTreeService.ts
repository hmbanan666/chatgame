import type { Game, GameObjectTree, TreeService } from '../../types'
import { TreeObject } from '../objects/treeObject'

export class GameTreeService implements TreeService {
  treesPerfectAmount = 180

  constructor(readonly game: Game) {}

  create(data: {
    id: string
    x: number
    zIndex: number
    treeType: GameObjectTree['treeType']
    variant: GameObjectTree['variant']
    size: number
    maxSize: number
  }): TreeObject {
    return new TreeObject({
      ...data,
      y: this.game.bottomY + 2,
      game: this.game,
    })
  }

  update() {}
}
