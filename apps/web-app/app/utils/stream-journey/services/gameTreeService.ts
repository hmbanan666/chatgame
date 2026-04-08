import type { BiomeType } from '@chatgame/sprites'
import type { Game, TreeService, TreeServiceCreateOptions } from '../types'
import { TreeObject } from '../objects/treeObject'

export class GameTreeService implements TreeService {
  constructor(readonly game: Game) {}

  getBiomeAt(x: number): BiomeType {
    // Single source of truth — ChunkService determines biomes
    const chunk = this.game.chunkService?.chunks?.find((c: any) => x >= c.startX && x < c.endX)
    if (chunk) {
      return chunk.biome as BiomeType
    }
    return 'GREEN'
  }

  create(data: TreeServiceCreateOptions): TreeObject {
    return new TreeObject({
      ...data,
      game: this.game,
    })
  }

  update() {
    // Trees and bushes are now created by ChunkService
    // TreeService only handles removal of old objects
    this.removeInactiveTrees()
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
