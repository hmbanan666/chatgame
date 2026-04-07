import { chargeRooms } from '~~/server/core/charge'
import { getTwitchController } from '~~/server/utils/twitch/twitch.controller'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const session = chargeRooms.find((room) => room.id === id)
  if (!session) {
    throw createError({
      status: 404,
    })
  }

  const twitch = getTwitchController()

  return {
    id: session.id,
    fuel: session.fuel,
    maxFuel: session.maxFuel,
    speed: session.speedMultiplier,
    isStopped: session.isStopped || session.fuel <= 0,
    effects: session.effects.filter((e) => !e.isExpired),
    stats: session.stats,
    viewerCount: session.viewerCount,
    biome: session.biome,
    caravan: session.caravan,
    nextCouponAt: twitch.nextCouponAt?.toISOString() ?? null,
  }
})
