export default defineEventHandler(async () => {
  return db.inventoryItem.findAll()
})
