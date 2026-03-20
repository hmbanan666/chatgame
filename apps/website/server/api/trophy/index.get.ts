export default defineEventHandler(async () => {
  return db.trophy.findAll()
})
