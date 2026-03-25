import { chargeRooms } from '~~/server/core/charge'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const session = chargeRooms.find((room) => room.id === id)
  if (!session) {
    throw createError({
      status: 404,
    })
  }

  return {
    id: session.id,
    fuel: session.fuel,
    maxFuel: session.maxFuel,
    speed: session.speed,
    isStopped: session.isStopped,
    effects: session.effects.filter((e) => !e.isExpired),
    stats: session.stats,
    viewerCount: session.viewerCount,
    biome: session.biome,
  }
})
