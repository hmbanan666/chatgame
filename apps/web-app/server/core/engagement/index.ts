import { StreamEngagementService } from './service'

const services = new Map<string, StreamEngagementService>()

export function getEngagementService(streamerId: string, streamId?: string): StreamEngagementService | null {
  const existing = services.get(streamerId)
  if (existing) {
    return existing
  }

  if (!streamId) {
    return null
  }

  const service = new StreamEngagementService(streamerId, streamId)
  services.set(streamerId, service)
  return service
}

export function destroyEngagementService(streamerId: string) {
  const service = services.get(streamerId)
  if (service) {
    service.destroy()
    services.delete(streamerId)
  }
}
