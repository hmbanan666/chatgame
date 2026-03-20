import type { InferInsertModel } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class CharacterLevelRepository {
  static create(data: InferInsertModel<typeof tables.characterLevels>) {
    const db = useDatabase()
    return db.insert(tables.characterLevels).values(data).returning()
  }
}
