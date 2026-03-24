import { chargeRooms } from '~~/server/core/charge'

const VALID_BIOMES = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ biome: string }>(event)

  const chargeRoom = chargeRooms.find((room) => room.id === id)
  if (!chargeRoom) {
    throw createError({ status: 404 })
  }

  if (!body?.biome || !VALID_BIOMES.includes(body.biome)) {
    throw createError({ status: 400 })
  }

  chargeRoom.biome = body.biome

  return { ok: true }
})
