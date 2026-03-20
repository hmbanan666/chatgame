export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const chargeRoom = chargeRooms.find((room) => room.id === id)
  if (!chargeRoom) {
    throw createError({
      status: 404,
    })
  }

  const modifiers = chargeRoom.modifiers.filter((m) => !m.isExpired)

  return {
    id: chargeRoom.id,
    startedAt: chargeRoom.startedAt,
    energy: chargeRoom.energy,
    baseRate: chargeRoom.baseRate,
    rate: chargeRoom.rate,
    ratePerMinute: chargeRoom.ratePerMinute,
    difficulty: chargeRoom.difficulty,
    messagesCount: chargeRoom.messages.length,
    modifiers,
  }
})
