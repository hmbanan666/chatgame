import { activateProduct } from '~~/server/core/product/activate'

const logger = useLogger('payment:status')

export default defineTask({
  meta: {
    name: 'payment:status',
    description: 'Watch if payment status changed',
  },
  async run() {
    // Only run in production
    if (import.meta.dev) {
      logger.info('Task not run in dev mode')
      return { result: true }
    }

    try {
      const payments = await prisma.payment.findMany({
        where: {
          status: { in: ['PENDING'] },
          createdAt: {
            gt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          },
        },
      })

      for (const payment of payments) {
        // Check payment status
        const status = await checkPayment(payment.externalId)
        if (status === 'PAID' && payment.status !== 'PAID') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
            },
          })

          await activateProduct({ productId: payment.productId, profileId: payment.profileId })

          logger.log(`Payment ${payment.id} changed to PAID`)
        }
      }
    } catch (error) {
      errorResolver(error)
    }

    return { result: true }
  },
})

async function checkPayment(id: string): Promise<'PAID' | 'PENDING' | null> {
  try {
    const { yookassaShopId, yookassaApiKey } = useRuntimeConfig()
    const credentials = btoa(`${yookassaShopId}:${yookassaApiKey}`)
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
    })

    const paymentOnProvider = await res.json()
    if (!paymentOnProvider?.id) {
      return null
    }

    if (paymentOnProvider.status === 'succeeded') {
      return 'PAID'
    }
    if (paymentOnProvider.status === 'pending') {
      return 'PENDING'
    }

    return null
  } catch (err) {
    console.error(err)
    return null
  }
}
