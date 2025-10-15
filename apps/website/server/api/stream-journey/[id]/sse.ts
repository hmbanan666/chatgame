import { createId } from '@paralleldrive/cuid2'
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

  const streamId = createId()
  const eventStream = createEventStream(event)

  logger.success(`New connection to room ${id}, stream id ${streamId}. Connections now: ${streamJourneyRoom.eventService.streams.size}`)

  streamJourneyRoom.eventService.streams.set(streamId, eventStream)

  eventStream.onClosed(async () => {
    streamJourneyRoom.eventService.streams.delete(streamId)
    logger.log(`Connection stream id ${streamId} closed`)
    await eventStream.close()
  })

  return eventStream.send()
})
