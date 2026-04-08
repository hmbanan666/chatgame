export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Missing token' })
  }

  const widgetToken = await db.widgetToken.find(token)
  if (!widgetToken) {
    throw createError({ statusCode: 404, message: 'Invalid widget token' })
  }

  return {
    roomId: widgetToken.roomId,
    streamerId: widgetToken.streamerId,
  }
})
