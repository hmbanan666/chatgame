export default defineEventHandler(async (event) => {
  const codename = getRouterParam(event, 'codename')
  if (!codename) {
    throw createError({ statusCode: 400, message: 'Missing codename' })
  }

  const sprite = await db.sprite.findByCodename(codename)
  if (!sprite) {
    throw createError({ statusCode: 404, message: 'Sprite not found' })
  }

  return sprite
})
