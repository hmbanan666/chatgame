import type { GameObject } from '../../types'
import { BaseScript } from './baseScript'

interface IMoveToRandomTargetScriptOptions {
  object: GameObject
  target: GameObject
}

export class MoveToTargetScript extends BaseScript {
  constructor({ target, object }: IMoveToRandomTargetScriptOptions) {
    super({ object })

    this.tasks = [this.setTarget(target), this.runToTarget()]
    this.isInterruptible = true
  }
}
