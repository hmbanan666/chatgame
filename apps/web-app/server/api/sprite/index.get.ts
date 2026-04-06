export default defineEventHandler(async () => {
  return db.sprite.findAll()
})
