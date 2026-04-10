import { useDatabase } from '../database'

export class CharacterRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.characters.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static findAll() {
    const db = useDatabase()
    return db.query.characters.findMany({
      orderBy: (t, { asc }) => [asc(t.coefficient), asc(t.price)],
    })
  }
}
