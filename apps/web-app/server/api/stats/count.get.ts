export default defineEventHandler(async () => {
  const count = await db.profile.count()
  return { count }
})
