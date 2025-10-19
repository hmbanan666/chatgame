import type { GameObject, GameScript, GameScriptTask } from '../../types'
import { createId } from '@paralleldrive/cuid2'

interface BaseScriptOptions {
  object: GameObject
}

export class BaseScript implements GameScript {
  id: GameScript['id']
  tasks: GameScript['tasks'] = []
  isInterruptible: GameScript['isInterruptible'] = false

  private object: GameObject

  constructor({ object }: BaseScriptOptions) {
    this.id = createId()
    this.object = object
  }

  live() {
    const activeTask = this.getActiveTask()
    if (!activeTask) {
      const nextTask = this.getNextIdleTask()
      if (!nextTask) {
        return this.markScriptAsFinished()
      }

      return this.markTaskAsActive(nextTask)
    }

    return activeTask.live()
  }

  getActiveTask() {
    return this.tasks.find((t) => t.status === 'ACTIVE')
  }

  getNextIdleTask() {
    return this.tasks.find((t) => t.status === 'IDLE')
  }

  markTaskAsActive(task: GameScriptTask) {
    task.status = 'ACTIVE'
  }

  markTaskAsDone() {
    const activeTask = this.getActiveTask()
    if (!activeTask) {
      return
    }

    activeTask.status = 'DONE'
  }

  markScriptAsFinished() {
    this.object.script = undefined
  }

  setTarget(target: GameObject): GameScriptTask {
    return {
      id: createId(),
      status: 'IDLE',
      live: () => {
        this.object.target = target
        this.object.state = 'MOVING'
        this.markTaskAsDone()
      },
    }
  }

  runToTarget(): GameScriptTask {
    return {
      id: createId(),
      status: 'IDLE',
      live: () => {
        const isMoving = this.object.move()
        if (!isMoving) {
          this.markTaskAsDone()
        }
      },
    }
  }

  runToTargetAndDestroy(): GameScriptTask {
    return {
      id: createId(),
      status: 'IDLE',
      live: () => {
        const isMoving = this.object.move()
        if (!isMoving && this.object.target) {
          this.object.target.state = 'DESTROYED'
          this.object.target = undefined
          this.markTaskAsDone()
        }
      },
    }
  }

  destroyTarget(): GameScriptTask {
    return {
      id: createId(),
      status: 'IDLE',
      live: () => {
        if (this.object.target) {
          this.object.target.state = 'DESTROYED'
          this.object.target = undefined
          this.markTaskAsDone()
        }
      },
    }
  }
}
