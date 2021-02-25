import { APIGatewayEvent, Context } from 'aws-lambda'

export const handler = async (event: APIGatewayEvent, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      data: 'typescriptFunction function',
    }),
  }
}
