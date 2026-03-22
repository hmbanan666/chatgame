import { rooms } from '~~/server/core/stream-journey'

const logger = useLogger('stream-journey:sse')

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      status: 400,
    })
  }

  const streamJourneyRoom = rooms.get(id)
  if (!streamJourneyRoom) {
    throw createError({
      status: 404,
    })
  }

  const eventStream = createEventStream(event)

  const streamId = streamJourneyRoom.addStream(eventStream)

  logger.success(`New SSE connection, room ${id}, streams: ${streamJourneyRoom.streamCount}`)

  eventStream.onClosed(async () => {
    streamJourneyRoom.removeStream(streamId)
    await eventStream.close()
    logger.log(`SSE closed, room ${id}, streams: ${streamJourneyRoom.streamCount}`)
  })

  return eventStream.send()
})
