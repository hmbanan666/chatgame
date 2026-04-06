import { and, eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class SpriteRepository {
  static findAll() {
    const db = useDatabase()
    return db.query.sprites.findMany()
  }

  static findByCodename(codename: string) {
    const db = useDatabase()
    return db.query.sprites.findFirst({
      where: (t, { eq }) => eq(t.codename, codename),
      with: { frames: true },
    })
  }

  static upsertSprite(data: {
    codename: string
    type?: string
    frameSize: number
    slotRoles: string[]
    defaultPalette: number[]
  }) {
    const db = useDatabase()
    return db.insert(tables.sprites)
      .values(data)
      .onConflictDoUpdate({
        target: tables.sprites.codename,
        set: {
          type: data.type ?? 'character',
          frameSize: data.frameSize,
          slotRoles: data.slotRoles,
          defaultPalette: data.defaultPalette,
          updatedAt: new Date(),
        },
      })
      .returning()
  }

  static upsertFrame(spriteId: string, name: string, pixels: [number, number, number][]) {
    const db = useDatabase()
    return db.insert(tables.spriteFrames)
      .values({ name, pixels, spriteId })
      .onConflictDoNothing()
      .returning()
  }

  static async saveFrame(spriteId: string, name: string, pixels: [number, number, number][]) {
    const db = useDatabase()
    const existing = await db.query.spriteFrames.findFirst({
      where: (t, { and, eq }) => and(eq(t.spriteId, spriteId), eq(t.name, name)),
    })

    if (existing) {
      return db.update(tables.spriteFrames)
        .set({ pixels, updatedAt: new Date() })
        .where(eq(tables.spriteFrames.id, existing.id))
        .returning()
    }

    return db.insert(tables.spriteFrames)
      .values({ name, pixels, spriteId })
      .returning()
  }

  static deleteFrame(spriteId: string, name: string) {
    const db = useDatabase()
    return db.delete(tables.spriteFrames)
      .where(and(
        eq(tables.spriteFrames.spriteId, spriteId),
        eq(tables.spriteFrames.name, name),
      ))
  }
}
