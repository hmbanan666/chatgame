import { useDatabase } from '../database'

export class Profile {
  static async find(id: string) {
    return useDatabase().query.profiles.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    })
  }
}
