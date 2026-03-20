import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const session = await getUserSession(event)

  if (!session?.user || !body.type) {
    throw createError({
      statusCode: 400,
      message: 'Invalid data',
    })
  }

  const type = body.type as string

  const profile = await db.profile.find(session.user!.id)
  if (!profile || profile.coupons < 1) {
    throw createError({
      status: 404,
      message: 'You do not have enough coupons',
    })
  }

  if (type === 'COINS') {
    await db.profile.addCoins(profile.id, 2)
    await db.profile.deductCoupons(profile.id, 1)

    await db.transaction.create({
      id: createId(),
      profileId: profile.id,
      entityId: profile.id,
      amount: 2,
      type: 'COINS_FROM_COUPON',
    })
  }

  return {
    ok: true,
  }
})
