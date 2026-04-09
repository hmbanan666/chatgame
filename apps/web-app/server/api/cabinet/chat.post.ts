import { getTwitchController } from '../../utils/twitch/twitch.controller'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const message = (body.message as string)?.trim()
  if (!message) {
    throw createError({ statusCode: 400, message: 'Empty message' })
  }

  const controller = getTwitchController()
  if (controller.status !== 'RUNNING') {
    throw createError({ statusCode: 503, message: 'Chat not connected' })
  }

  controller.say(message)

  return { ok: true }
})
