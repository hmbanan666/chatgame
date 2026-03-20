import type { EventHandlerRequest } from 'h3'

export default defineEventHandler<EventHandlerRequest, Promise<{ ok: boolean }>>(async (event) => {
  const id = getRouterParam(event, 'id')

  const token = await db.twitchToken.find(id!)
  if (!token) {
    throw createError({
      status: 404,
    })
  }

  await db.twitchToken.updateOnlineAt(id!)

  return {
    ok: true,
  }
})
