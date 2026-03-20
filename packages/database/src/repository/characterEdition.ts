import type { InferInsertModel } from 'drizzle-orm'
import { eq, sql } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class CharacterEditionRepository {
  static findWithCharacter(id: string) {
    const db = useDatabase()
    return db.query.characterEditions.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: { character: true },
    })
  }

  static create(data: InferInsertModel<typeof tables.characterEditions>) {
    const db = useDatabase()
    return db.insert(tables.characterEditions).values(data).returning()
  }

  static addXp(id: string, amount = 1) {
    const db = useDatabase()
    return db.update(tables.characterEditions)
      .set({ xp: sql`${tables.characterEditions.xp} + ${amount}` })
      .where(eq(tables.characterEditions.id, id))
  }

  static addLevel(id: string) {
    const db = useDatabase()
    return db.update(tables.characterEditions)
      .set({ level: sql`${tables.characterEditions.level} + 1` })
      .where(eq(tables.characterEditions.id, id))
  }
}
