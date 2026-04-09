export default defineEventHandler(async () => {
  const streamers = await db.profile.findActiveStreamers()
  const streamer = streamers[0]
  if (!streamer) {
    return []
  }

  const rows = await db.streamerViewer.findRandomNames(streamer.id, 20)
  return rows.map((r) => r.name).filter((n): n is string => !!n)
})
