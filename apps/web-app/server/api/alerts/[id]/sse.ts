import { createId } from '@paralleldrive/cuid2'
import { getAlertService } from '~~/server/core/alerts'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ status: 400 })
  }

  const alertService = getAlertService(id)
  const streamId = createId()
  const eventStream = createEventStream(event)

  alertService.addStream(streamId, eventStream)

  eventStream.onClosed(async () => {
    alertService.removeStream(streamId)
    await eventStream.close()
  })

  return eventStream.send()
})
