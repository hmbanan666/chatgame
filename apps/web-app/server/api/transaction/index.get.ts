export default defineEventHandler(
  async () => {
    const transactions = await db.transaction.findRecent(15)

    return transactions
  },
)
