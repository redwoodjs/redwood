import type { APIGatewayEvent, Context } from 'aws-lambda'

/**
 * The handler function is your code that processes http request events.
 * You can use return and throw to send a response or error, respectively.
 * 
 * @param { import('aws-lambda').APIGatewayEvent } event - an object which contains information from the invoker.
 * @param { import('aws-lambda').Context } context - contains information about the invocation,
 * function, and execution environment.
 */
export const handler = async (event: APIGatewayEvent, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      data: 'typescriptFunction function',
    }),
  }
}
