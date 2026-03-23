import process from 'node:process'

const logger = useLogger('request')

export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  // Only log page requests (not API, not static)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_nuxt/') || url.pathname.startsWith('/static/')) {
    return
  }

  const mem = process.memoryUsage()
  const rss = Math.round(mem.rss / 1024 / 1024)
  const heap = Math.round(mem.heapUsed / 1024 / 1024)

  logger.info(`${url.pathname} RSS=${rss}MB heap=${heap}MB`)
})
