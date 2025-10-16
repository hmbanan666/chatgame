import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)

    const data = await readBody(event)
    const productId = data?.productId

    if (!session?.user || !productId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid data',
      })
    }

    const profile = await prisma.profile.findFirst({
      where: { id: session.user.id },
    })
    if (!profile) {
      throw createError({
        status: 404,
      })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId },
    })
    if (!product) {
      throw createError({
        status: 404,
      })
    }

    // Create payment on Provider
    const paymentBody = {
      amount: {
        value: product.price,
        currency: 'RUB',
      },
      capture: true,
      description: `Приобретение "${product.title}" для профиля ID ${profile.id}`,
      metadata: {
        profileId: profile.id,
        productId: product.id,
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://chatgame.space/#shop',
      },
    }

    const { yookassaShopId, yookassaApiKey } = useRuntimeConfig()
    const credentials = btoa(`${yookassaShopId}:${yookassaApiKey}`)
    const res = await fetch(`https://api.yookassa.ru/v3/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': createId(),
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(paymentBody),
    })

    const paymentOnProvider = await res.json()
    if (!paymentOnProvider?.id || !paymentOnProvider?.confirmation) {
      throw createError({
        status: 500,
        message: 'Payment creation error',
      })
    }

    const redirectUrl: string = paymentOnProvider.confirmation?.confirmation_url ?? '/'

    // Create payment
    await prisma.payment.create({
      data: {
        id: createId(),
        externalId: paymentOnProvider.id,
        provider: 'YOOKASSA',
        status: 'PENDING',
        profileId: profile.id,
        productId: product.id,
        amount: product.price,
      },
    })

    return {
      ok: true,
      result: redirectUrl,
    }
  } catch (error) {
    throw errorResolver(error)
  }
})
