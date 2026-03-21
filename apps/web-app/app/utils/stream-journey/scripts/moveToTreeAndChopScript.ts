import type { TreeObject } from '../objects/treeObject'
import type { GameObject, GameScriptTask, MovementTarget } from '../types'
import { createId } from '@paralleldrive/cuid2'
import { getRandInteger } from '../utils/random'
import { BaseScript } from './baseScript'

interface MoveToTreeAndChopOptions {
  object: GameObject
  target: MovementTarget
}

export class MoveToTreeAndChopScript extends BaseScript {
  constructor({ target, object }: MoveToTreeAndChopOptions) {
    super({ object })

    this.tasks = [
      this.setTarget(target),
      this.runToTarget(),
      this.chopTree(target as unknown as TreeObject),
    ]
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
