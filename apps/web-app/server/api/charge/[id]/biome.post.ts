import { chargeRooms } from '~~/server/core/charge'

const logger = useLogger('charge:biome')
const VALID_BIOMES = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ biome: string }>(event)

  const chargeRoom = chargeRooms.find((room) => room.id === id)
  if (!chargeRoom) {
    logger.warn(`Charge room not found: ${id}`)
    throw createError({ status: 404 })
  }

  if (!body?.biome || !VALID_BIOMES.includes(body.biome)) {
    logger.warn(`Invalid biome: ${body?.biome}`)
    throw createError({ status: 400 })
  }

  if (chargeRoom.biome !== body.biome) {
    logger.info(`Biome changed: ${chargeRoom.biome} → ${body.biome}`)
  }

  chargeRoom.biome = body.biome

  return { ok: true }
})
