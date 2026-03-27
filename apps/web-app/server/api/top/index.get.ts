export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sortBy = query.sort === 'coins' ? 'coins' : query.sort === 'coupons' ? 'coupons' : query.sort === 'watchTimeMin' ? 'watchTimeMin' : 'level'

  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 50)

  return db.profile.findTop(sortBy, limit)
})
