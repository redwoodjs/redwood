import { logger } from 'src/lib/logger'

export const handler = async (event, context) => {
  logger.info('Invoked hello function')

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: 'nested function',
    }),
  }
}
