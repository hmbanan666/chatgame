export default defineEventHandler(async () => {
  const { twitchChannelId } = useRuntimeConfig()

  const profile = await db.profile.findByTwitchId(twitchChannelId)
  if (!profile) {
    return []
  }

  const rows = await db.streamerViewer.findRandomNames(profile.id, 20)
  return rows.map((r) => r.name).filter((n): n is string => !!n)
})
