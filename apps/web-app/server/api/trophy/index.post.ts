import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler(
  async (event) => {
    const formData = await readFormData(event)
    const session = await getUserSession(event)

    if (!session?.user || !formData.has('name') || !formData.has('description')) {
      throw createError({
        statusCode: 400,
        message: 'Invalid data',
      })
    }

    let name = formData.get('name') as string
    let description = formData.get('description') as string

    const profile = await db.profile.find(session.user!.id)
    if (!profile) {
      throw createError({
        statusCode: 404,
        message: 'Profile not found',
      })
    }

    // sanitize, max chars
    name = name.trim().substring(0, 35)
    description = description.trim().substring(0, 140)

    const [trophy] = await db.trophy.create({
      id: createId(),
      name,
      description,
      points: 10,
      rarity: 0,
    })

    return sendRedirect(event, `/trophy/${trophy!.id}`)
  },
)
