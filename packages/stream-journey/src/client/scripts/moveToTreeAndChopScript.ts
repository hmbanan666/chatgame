import type { GameObject, GameScriptTask } from '../../types'
import { BaseScript } from './baseScript'

interface IMoveToTreeAndChopScriptOptions {
  object: GameObject
  target: GameObject
  chopFunc: () => boolean
}

export class MoveToTreeAndChopScript extends BaseScript {
  constructor({ target, object, chopFunc }: IMoveToTreeAndChopScriptOptions) {
    super({ object })

    this.tasks = [
      this.setTarget(target),
      this.runToTarget(),
      this.chop(chopFunc),
      this.destroyTarget(),
    ]
  }

  chop(func: () => boolean): GameScriptTask {
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
