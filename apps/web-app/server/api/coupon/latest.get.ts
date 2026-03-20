export default defineEventHandler(async () => {
  return db.coupon.findLatestTaken(12)
})
