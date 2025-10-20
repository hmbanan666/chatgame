import { useDatabase } from '../database'
import { Profile } from './profile'

class Repository {
  readonly profile = Profile

  async checkHealth(): Promise<boolean> {
    await useDatabase().query.profiles.findFirst()
    return true
  }
}

export const repository = new Repository()
