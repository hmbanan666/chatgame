export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const chargeRoom = chargeRooms.find((room) => room.id === id)
  if (!chargeRoom) {
    throw createError({
      status: 404,
    })
  }

  if (chargeRoom.event.stream) {
    throw createError({
      status: 409,
    })
  }

  const eventStream = createEventStream(event)

  chargeRoom.event.stream = eventStream

  eventStream.onClosed(async () => {
    chargeRoom.event.stream = null
    await eventStream.close()
  })

  return eventStream.send()
})
