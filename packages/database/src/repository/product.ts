import { useDatabase } from '../database'

export class ProductRepository {
  static find(id: string) {
    const db = useDatabase()
    return db.query.products.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    })
  }

  static findActive() {
    const db = useDatabase()
    return db.query.products.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => asc(t.priority),
      with: {
        items: {
          orderBy: (t, { asc }) => asc(t.priority),
        },
      },
    })
  }

  static findWithItems(id: string) {
    const db = useDatabase()
    return db.query.products.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        items: true,
      },
    })
  }
}
