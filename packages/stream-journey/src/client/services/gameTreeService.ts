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
  }) {
    return new TreeObject({
      ...data,
      y: this.game.bottomY + 2,
      game: this.game,
    })
  }

  update() {}

  getNearestObstacle(x: number): TreeObject | undefined {
    // Only on right side + isObstacle
    const trees = this.game.children
      .filter((obj) => obj.type === 'TREE' && obj.x > x) as TreeObject[]

    return trees.filter((obj) => obj.isAnObstacleToWagon)
      .sort((a, b) => a.x - b.x)[0]
  }
}
