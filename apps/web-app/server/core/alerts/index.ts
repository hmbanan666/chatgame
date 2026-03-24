import { AlertService } from './service'

const services = new Map<string, AlertService>()

export function getAlertService(id: string): AlertService {
  let service = services.get(id)
  if (!service) {
    service = new AlertService()
    services.set(id, service)
  }
  return service
}
