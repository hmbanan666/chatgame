export default defineEventHandler(async (event) => {
  const twitchChannelId = getRouterParam(event, 'streamerId')
  if (!twitchChannelId) {
    throw createError({ status: 400 })
  }

  const profile = await db.profile.findByTwitchId(twitchChannelId)
  if (!profile) {
    throw createError({ status: 404 })
  }

  return db.backlogItem.findActiveByStreamerId(profile.id)
})
