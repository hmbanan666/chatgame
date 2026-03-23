import { H3Error } from 'h3'

const logger = useLogger('error')

export function errorResolver(exception: unknown) {
  if (exception instanceof H3Error) {
    throw exception
  }

  // Ok, something interesting happened
  logger.error('Unhandled error:', exception)

  return createError({
    statusCode: 500,
    statusMessage: 'Internal server error',
  })
}
