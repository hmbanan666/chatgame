import { searchCategories } from '../../utils/twitch/twitch.api'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const query = getQuery(event)
  const q = String(query.q ?? '').trim()
  if (!q) {
    return []
  }

  return searchCategories(profile.twitchId!, q)
})
