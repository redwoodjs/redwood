import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  sign,
  verifyWebhook,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SIGNATURE_HEADER,
} from './secureHandler'

const payload = 'No more secrets, Marty.'
const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

// See: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/aws-lambda/trigger/api-gateway-proxy.d.ts
const buildEvent = ({
  payload,
  signature,
  signatureHeader,
}): APIGatewayProxyEvent => {
  const headers = {}
  headers[signatureHeader.toLocaleLowerCase()] = signature

  return {
    body: payload,
    headers,
    multiValueHeaders: {},
    isBase64Encoded: false,
    path: '',
    pathParameters: null,
    stageVariables: null,
    httpMethod: 'GET',
    queryStringParameters: null,
    requestContext: null,
    resource: null,
    multiValueQueryStringParameters: null,
  }
}

describe('secureHandler', () => {
  describe('webhooks via event', () => {
    describe('using the timestampScheme verifier', () => {
      describe('signs a payload with default timestamp', () => {
        test('it has a time and scheme', () => {
          const options = { type: 'timestampScheme' }
          const signature = sign({ payload, secret, options })

          expect(signature).toMatch(/t=(\d+),v1=([\da-f]+)/)
        })
      })

      describe('with a webhook event', () => {
        test('it can verify an event body payload with a signature it generates', () => {
          const options = { type: 'timestampScheme' }
          const signature = sign({ payload, secret, options })

          const event = buildEvent({
            payload,
            signature,
            signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
          })

          expect(verifyWebhook({ event, secret, options })).toBeTruthy()
        })

        test('it can verify overriding the event body payload with a signature it generates', () => {
          const options = { type: 'timestampScheme' }
          const signature = sign({ payload, secret, options })

          const event = buildEvent({
            payload: { body: payload },
            signature,
            signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
          })

          expect(
            verifyWebhook({ event, payload, secret, options })
          ).toBeTruthy()
        })

        test('it denies verification when signed with a different secret', () => {
          const options = { type: 'timestampScheme' }
          const signature = sign({ payload, secret: 'WERNER_BRANDES', options })

          const event = buildEvent({
            payload,
            signature,
            signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
          })

          expect(() => {
            verifyWebhook({ event, secret, options })
          }).toThrow(WebhookVerificationError)
        })

        test('it verifies when within the timestamp tolerance', () => {
          const options = { type: 'timestampScheme' }

          const signature = sign({
            payload,
            secret,
            options: { ...options, timestamp: Date.now() - 10 * 60_000 },
          })

          const event = buildEvent({
            payload,
            signature,
            signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
          })

          expect(() => {
            verifyWebhook({
              event,
              secret,
              options: { ...options, tolerance: 100_000 },
            })
          }).toBeTruthy()
        })

        test('it denies verification when verifying with a short tolerance', () => {
          const options = { type: 'timestampScheme' }

          const signature = sign({
            payload,
            secret,
            options: { ...options, timestamp: Date.now() - 10 * 60_000 },
          })

          const event = buildEvent({
            payload,
            signature,
            signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
          })

          expect(() => {
            verifyWebhook({
              event,
              secret,
              options: { ...options, tolerance: 5_000 },
            })
          }).toThrow(WebhookVerificationError)
        })
      })
    })
  })
})
