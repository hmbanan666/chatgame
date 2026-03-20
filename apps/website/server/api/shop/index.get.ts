export default defineEventHandler(
  async () => {
    const products = await db.product.findActive()
    if (!products.length) {
      return []
    }

    return products
  },
)
