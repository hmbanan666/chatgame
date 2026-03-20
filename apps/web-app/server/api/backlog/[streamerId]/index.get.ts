export default defineEventHandler(async (event) => {
  const streamerId = getRouterParam(event, 'streamerId')
  if (!streamerId) {
    throw createError({ status: 400 })
  }

  const streamer = await db.streamer.findByTwitchChannelId(streamerId)
  if (!streamer) {
    throw createError({ status: 404 })
  }

  return db.backlogItem.findActiveByStreamerId(streamer.id)
})
