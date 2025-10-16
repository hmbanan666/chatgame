import type { Game, TreeService, TreeServiceCreateOptions } from '../../types'
import { createId } from '@paralleldrive/cuid2'
import { TreeObject } from '../objects/treeObject'
import { getRandInteger } from '../utils/random'

export class GameTreeService implements TreeService {
  private treesPerfectAmount = 30

  constructor(readonly game: Game) {
    this.generateTrees()
  }

  create(data: TreeServiceCreateOptions): TreeObject {
    return new TreeObject({
      ...data,
      game: this.game,
    })
  }

  update() {
    this.regenerateTrees()
    this.removeInactiveTrees()
  }

  private generateTrees() {
    const amount = Math.round(this.treesPerfectAmount)

    for (let i = 0; i < amount; i++) {
      const x = getRandInteger(0, 7000)

      this.create({
        id: createId(),
        x,
        variant: 'GREEN',
        size: 5,
        maxSize: getRandInteger(80, 125),
      })
    }
  }

  private regenerateTrees() {
    if (!this.game.wagonService.wagon?.x) {
      return
    }

    // Check if we have enough trees near Wagon
    const isEnoughTrees = this.game.wagonService.getNearestTrees().length >= this.treesPerfectAmount
    if (!isEnoughTrees) {
      const x = getRandInteger(this.game.wagonService.wagon.x + 200, this.game.wagonService.wagon.x + 2400)

      this.create({
        id: createId(),
        x,
        variant: 'GREEN',
        size: 5,
        maxSize: getRandInteger(80, 125),
      })
    }
  }

  private removeInactiveTrees() {
    if (!this.game.wagonService.wagon?.x) {
      return
    }

    const x = this.game.wagonService.wagon.x
    const distance = 1000

    const treesToRemove = this.game.children.filter((obj) => obj.type === 'TREE' && obj.x < x - distance)
    for (const tree of treesToRemove) {
      this.game.removeObject(tree.id)
    }
  }
}
