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

  logger.success(`New connection to room ${id}, stream id ${streamId}.`)

  eventStream.onClosed(async () => {
    streamJourneyRoom.removeStream(streamId)
    await eventStream.close()
    logger.log(`Connection stream id ${streamId} closed`)
  })

  return eventStream.send()
})
