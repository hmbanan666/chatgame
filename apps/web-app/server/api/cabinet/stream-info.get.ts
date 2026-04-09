import { getChannelInfo } from '../../utils/twitch/twitch.api'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer || !profile.twitchId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const info = await getChannelInfo(profile.twitchId)
  return info ?? { title: '', gameName: '', gameId: '', tags: [], language: '' }
})
