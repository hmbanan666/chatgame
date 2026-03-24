import { ViewerQuestService } from './service'

const services = new Map<string, ViewerQuestService>()

export function getViewerQuestService(streamerId: string, channelId?: string): ViewerQuestService {
  let service = services.get(streamerId)
  if (!service) {
    service = new ViewerQuestService(streamerId, channelId ?? streamerId)
    services.set(streamerId, service)
  }
  return service
}
