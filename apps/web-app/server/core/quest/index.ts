import { ViewerQuestService } from './service'

const services = new Map<string, ViewerQuestService>()

export function getViewerQuestService(streamerId: string): ViewerQuestService {
  let service = services.get(streamerId)
  if (!service) {
    service = new ViewerQuestService(streamerId)
    services.set(streamerId, service)
  }
  return service
}
