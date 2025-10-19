import type { GameObject, GameScriptTask } from '../../types'
import { BaseScript } from './baseScript'

interface IMoveToFlagAndCheckScriptOptions {
  object: GameObject
  target: GameObject
  checkFunc: () => boolean
}

export class MoveToFlagAndCheckScript extends BaseScript {
  constructor({ target, object, checkFunc }: IMoveToFlagAndCheckScriptOptions) {
    super({ object })

    this.tasks = [
      this.setTarget(target),
      this.runToTarget(),
      this.check(checkFunc),
      this.destroyTarget(),
    ]
  }

  check(func: () => boolean): GameScriptTask {
    return {
      id: '3',
      status: 'IDLE',
      live: () => {
        const isDone = func()
        if (isDone) {
          this.markTaskAsDone()
        }
      },
    }
  }
}
