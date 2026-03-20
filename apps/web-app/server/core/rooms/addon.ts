import { BaseRoom } from './base'

interface AddonRoomOptions {
  token: string
}

export class AddonRoom extends BaseRoom {
  constructor({ token }: AddonRoomOptions) {
    super({ id: token, type: 'ADDON' })
  }
}
