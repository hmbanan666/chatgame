import process from 'node:process'

export default defineNitroPlugin(() => {
  const logger = useLogger('memory')

  const logMemory = () => {
    const mem = process.memoryUsage()
    const rss = Math.round(mem.rss / 1024 / 1024)
    const heapUsed = Math.round(mem.heapUsed / 1024 / 1024)
    const heapTotal = Math.round(mem.heapTotal / 1024 / 1024)
    const external = Math.round(mem.external / 1024 / 1024)
    const uptime = Math.round(process.uptime())

    logger.info(`RSS=${rss}MB heap=${heapUsed}/${heapTotal}MB ext=${external}MB uptime=${uptime}s`)
  }

  // Log every 10 seconds to catch spikes
  logMemory()
  setInterval(logMemory, 10_000)
})
