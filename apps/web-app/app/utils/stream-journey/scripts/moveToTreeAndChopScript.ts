import type { TreeObject } from '../objects/treeObject'
import type { GameObject, GameScriptTask, MovementTarget } from '../types'
import { createId } from '@paralleldrive/cuid2'
import { TargetPoint } from '../objects/targetPoint'
import { getRandInteger } from '../utils/random'
import { BaseScript } from './baseScript'

interface MoveToTreeAndChopOptions {
  object: GameObject
  target: MovementTarget
}

export class MoveToTreeAndChopScript extends BaseScript {
  private tree: TreeObject

  constructor({ target, object }: MoveToTreeAndChopOptions) {
    super({ object })

    this.tree = target as unknown as TreeObject
    this.tree.chopperCount++

    // Spread players around the tree so they don't stack
    const offset = getRandInteger(-60, 60)
    const moveTarget = new TargetPoint(this.tree.x + offset, this.tree.y)

    this.tasks = [
      this.setTarget(moveTarget),
      this.runToTarget(),
      this.chopTree(this.tree),
    ]
  }

  destroy() {
    this.tree.chopperCount = Math.max(0, this.tree.chopperCount - 1)
  }

  private chopTree(tree: TreeObject): GameScriptTask {
    let chopCooldown = 0

    return {
      id: createId(),
      status: 'IDLE',
      live: () => {
        // Tree already destroyed by someone else
        if (tree.destroyed || tree.health <= 0) {
          this.markTaskAsDone()
          return
        }

        chopCooldown++

        // Chop every 30-50 frames (~0.5-0.8 sec)
        if (chopCooldown > getRandInteger(30, 50)) {
          chopCooldown = 0
          tree.chop()
        }

        // Done when tree health depleted
        if (tree.health <= 0) {
          this.markTaskAsDone()
        }
      },
    }
  }
}
