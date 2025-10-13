import type { GameObject } from '../../types'
import { BaseScript } from './baseScript'

interface IMoveToRandomTargetScriptOptions {
  object: GameObject
  target: GameObject
}

export class MoveToFlagScript extends BaseScript {
  constructor({ target, object }: IMoveToRandomTargetScriptOptions) {
    super({ object })

    this.tasks = [this.setTarget(target), this.runToTargetAndDestroy()]
    this.isInterruptible = true
  }
}
