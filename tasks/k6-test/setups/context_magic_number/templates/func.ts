import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import { setContext } from '@redwoodjs/context'

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
) => {
  const magicNumber = event.queryStringParameters?.magicNumber ?? 0

  setContext({
    magicNumber,
  })

  const sleep = Math.random() * 200
  await new Promise((resolve) => setTimeout(resolve, sleep))

  const numberFromContext = (context.magicNumber ?? -1) as number
  if (magicNumber !== numberFromContext) {
    throw new Error(`Expected ${magicNumber} but got ${numberFromContext}`)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      value: numberFromContext,
    }),
  }
}
