import process from 'node:process'

export default defineEventHandler(() => {
  const mem = process.memoryUsage()
  return {
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`,
    uptime: `${Math.round(process.uptime())}s`,
  }
})
