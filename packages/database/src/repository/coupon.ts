import type { InferInsertModel } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { useDatabase } from '../database'
import * as tables from '../tables'

export class CouponRepository {
  static findLatestTaken(limit: number) {
    const db = useDatabase()
    return db.query.coupons.findMany({
      where: (t, { eq }) => eq(t.status, 'TAKEN'),
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
    })
  }

  static findByActivationCommandSince(command: string, since: Date) {
    const db = useDatabase()
    return db.query.coupons.findFirst({
      where: (t, { eq, and, gte }) => and(
        eq(t.activationCommand, command),
        gte(t.createdAt, since),
      ),
    })
  }

  static findByProfileSince(profileId: string, since: Date) {
    const db = useDatabase()
    return db.query.coupons.findFirst({
      where: (t, { eq, and, gte }) => and(
        eq(t.profileId, profileId),
        gte(t.createdAt, since),
      ),
    })
  }

  static create(data: InferInsertModel<typeof tables.coupons>) {
    const db = useDatabase()
    return db.insert(tables.coupons).values(data).returning()
  }

  static update(id: string, data: Partial<InferInsertModel<typeof tables.coupons>>) {
    const db = useDatabase()
    return db.update(tables.coupons)
      .set(data)
      .where(eq(tables.coupons.id, id))
  }

  static async generateCommand(since: Date): Promise<string> {
    const number = Math.floor(Math.random() * 90 + 10)

    const existing = await CouponRepository.findByActivationCommandSince(number.toString(), since)
    if (existing) {
      return CouponRepository.generateCommand(since)
    }

    return number.toString()
  }

  static async generate(since: Date) {
    const db = useDatabase()
    const activationCommand = await CouponRepository.generateCommand(since)

    const [coupon] = await db.insert(tables.coupons).values({
      id: createId(),
      activationCommand,
      status: 'CREATED',
    }).returning()

    return coupon
  }
}
