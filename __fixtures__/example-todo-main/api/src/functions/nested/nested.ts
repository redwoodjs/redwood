import { logger } from 'src/lib/logger'

// Use shared libs here, to validate during tests
import magicImportBazinga from 'shared/src/bazinga'
import relativeImportBazinga from '../../../../shared/src/bazinga'
import sharedIndex from '../../../../shared/src'

export const handler = async (event, context) => {
  logger.info('Invoked nested function')

  console.log(magicImportBazinga())
  console.log(relativeImportBazinga())
  console.log(sharedIndex())

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
