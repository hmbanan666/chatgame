export default defineEventHandler(async () => {
  const { twitchChannelId } = useRuntimeConfig()

  const streamer = await db.streamer.findByTwitchChannelId(twitchChannelId)
  if (!streamer) {
    return []
  }

  const rows = await db.streamerViewer.findRandomNames(streamer.id, 20)
  return rows.map((r) => r.name).filter((n): n is string => !!n)
})
