export default defineEventHandler(async () => {
  const characters = await db.character.findAll()
  if (!characters?.length) {
    return []
  }

  return characters
})
