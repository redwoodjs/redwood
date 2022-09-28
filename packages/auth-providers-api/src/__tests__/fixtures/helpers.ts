import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

export const req = {
  event: {} as APIGatewayProxyEvent,
  context: {} as LambdaContext,
}
