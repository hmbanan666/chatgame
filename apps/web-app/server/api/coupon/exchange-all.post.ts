import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile || profile.coupons < 1) {
    throw createError({ statusCode: 400, message: 'No coupons to exchange' })
  }

  const couponsToExchange = profile.coupons
  const coinsToReceive = couponsToExchange * 2

  await db.profile.addCoins(profile.id, coinsToReceive)
  await db.profile.deductCoupons(profile.id, couponsToExchange)

  await db.transaction.create({
    id: createId(),
    profileId: profile.id,
    entityId: profile.id,
    amount: coinsToReceive,
    type: 'COUPONS_EXCHANGED',
    text: `Обмен ${couponsToExchange} купонов на ${coinsToReceive} монет`,
  })

  return {
    ok: true,
    exchanged: couponsToExchange,
    coinsReceived: coinsToReceive,
  }
})
