import { isValidTagColor } from '#shared/tags/colors'

const MAX_NAME_LENGTH = 32
const MAX_TAGS_PER_STREAMER = 30

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
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const color = body?.color

  if (!name || name.length > MAX_NAME_LENGTH) {
    throw createError({ statusCode: 400, message: 'Invalid tag name' })
  }
  if (!isValidTagColor(color)) {
    throw createError({ statusCode: 400, message: 'Invalid tag color' })
  }

  // Prevent spam — soft cap per streamer
  const existing = await db.streamerTag.findByStreamer(profile.id)
  if (existing.length >= MAX_TAGS_PER_STREAMER) {
    throw createError({ statusCode: 400, message: 'TAG_LIMIT_REACHED' })
  }
  if (existing.some((t) => t.name === name)) {
    throw createError({ statusCode: 409, message: 'TAG_NAME_TAKEN' })
  }

  try {
    const tag = await db.streamerTag.create({ streamerId: profile.id, name, color })
    return { tag }
  } catch {
    throw createError({ statusCode: 409, message: 'TAG_NAME_TAKEN' })
  }
})
