export default defineEventHandler(async () => {
  return db.player.findRandomNames(20)
})
