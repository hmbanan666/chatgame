import { searchCategories, updateChannelInfo } from '../../utils/twitch/twitch.api'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer || !profile.twitchId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const params: { title?: string, game_id?: string, tags?: string[] } = {}

  if (body.title !== undefined) {
    params.title = String(body.title).slice(0, 140)
  }

  if (body.gameName) {
    const categories = await searchCategories(body.gameName)
    if (categories.length > 0) {
      params.game_id = categories[0]!.id
    }
  }

  if (body.gameId) {
    params.game_id = String(body.gameId)
  }

  if (Array.isArray(body.tags)) {
    params.tags = body.tags.slice(0, 10).map((t: unknown) => String(t).slice(0, 25))
  }

  if (Object.keys(params).length === 0) {
    return { ok: false }
  }

  const success = await updateChannelInfo(profile.twitchId, params)
  return { ok: success }
})
