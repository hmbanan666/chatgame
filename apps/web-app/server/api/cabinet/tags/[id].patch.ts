import { isValidTagColor } from '#shared/tags/colors'

const MAX_NAME_LENGTH = 32

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing tag id' })
  }

  const body = await readBody(event)
  const patch: { name?: string, color?: string } = {}

  if (body?.name !== undefined) {
    if (typeof body.name !== 'string') {
      throw createError({ statusCode: 400, message: 'Invalid tag name' })
    }
    const trimmed = body.name.trim()
    if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
      throw createError({ statusCode: 400, message: 'Invalid tag name' })
    }
    patch.name = trimmed
  }

  if (body?.color !== undefined) {
    if (!isValidTagColor(body.color)) {
      throw createError({ statusCode: 400, message: 'Invalid tag color' })
    }
    patch.color = body.color
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update' })
  }

  try {
    const updated = await db.streamerTag.update(id, profile.id, patch)
    if (!updated) {
      throw createError({ statusCode: 404, message: 'Tag not found' })
    }
    return { tag: updated }
  } catch (err: any) {
    if (err?.statusCode) {
      throw err
    }
    throw createError({ statusCode: 409, message: 'TAG_NAME_TAKEN' })
  }
})
