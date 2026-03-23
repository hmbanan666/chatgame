export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') {
    event.headers.set('Access-Control-Allow-Origin', '*')
    event.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    return event
  }

  const session = await getUserSession(event)
  if (session?.user) {
    // Already authenticated
    return
  }

  if (event.method !== 'GET') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
})
