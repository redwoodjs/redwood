import type { APIGatewayEvent, Context } from 'aws-lambda'

import { storage, signer } from 'src/lib/storage'

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const unauthorizedResponse = {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: 'Unauthorized' }),
  }

  // Extract the token
  const token = event.queryStringParameters?.token
  if (!token) {
    return unauthorizedResponse
  }

  // Decode the token
  const decoded = signer.decode(token)
  if (!decoded) {
    return unauthorizedResponse
  }

  const { adapter: adapterName, reference, expiry } = decoded

  // Validate the expiry
  if (expiry && expiry < Date.now()) {
    return unauthorizedResponse
  }

  // Validate the adapter
  const adapter = storage.findAdapter(adapterName)
  if (!adapter) {
    return unauthorizedResponse
  }

  // Lookup and return the data
  const result = await adapter.readData(reference)
  return {
    statusCode: 200,
    headers: {
      // 'Content-Type': 'application/json',
    },
    body: result,
  }
}
