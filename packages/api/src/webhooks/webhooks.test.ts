import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  signPayload,
  verifyEvent,
  verifySignature,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SIGNATURE_HEADER,
} from './index'

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

describe('webhooks', () => {
  describe('using the timestampScheme verifier', () => {
    describe('signs a payload with default timestamp', () => {
      test('it has a time and scheme signature', () => {
        const options = { type: 'timestampSchemeVerifier' }
        const signature = signPayload({ payload, secret, options })

        expect(signature).toMatch(/t=(\d+),v1=([\da-f]+)/)
      })

      test('it signs and verifies', () => {
        const options = { type: 'timestampSchemeVerifier' }
        const signature = signPayload({ payload, secret, options })

        expect(
          verifySignature({ payload, secret, signature, options })
        ).toBeTruthy()
      })
    })
  })

  describe('using the sha1 verifier', () => {
    describe('signs a payload', () => {
      test('it has a sha1 signature', () => {
        const options = { type: 'sha1Verifier' }
        const signature = signPayload({ payload, secret, options })

        expect(signature).toMatch(/sha1=([\da-f]+)/)
      })

      test('it signs and verifies', () => {
        const options = { type: 'sha1Verifier' }
        const signature = signPayload({ payload, secret, options })

        expect(
          verifySignature({ payload, secret, signature, options })
        ).toBeTruthy()
      })
    })
  })

  describe('using the sha256 verifier', () => {
    describe('signs a payload', () => {
      test('it has a sha256 signature', () => {
        const options = { type: 'sha256Verifier' }
        const signature = signPayload({ payload, secret, options })

        expect(signature).toMatch(/sha256=([\da-f]+)/)
      })

      test('it signs and verifies', () => {
        const options = { type: 'sha256Verifier' }
        const signature = signPayload({ payload, secret, options })

        expect(
          verifySignature({ payload, secret, signature, options })
        ).toBeTruthy()
      })
    })
  })

  describe('using the secret key verifier', () => {
    describe('signs a payload', () => {
      test('it has the key as a signature', () => {
        const options = { type: 'secretKeyVerifier' }
        const signature = signPayload({ payload, secret, options })

        expect(signature).toEqual(secret)
      })

      test('it signs and verifies', () => {
        const options = { type: 'secretKeyVerifier' }
        const signature = signPayload({ payload, secret, options })

        expect(
          verifySignature({ payload, secret, signature, options })
        ).toBeTruthy()
      })
    })
  })

  describe('using the JWT verifier', () => {
    describe('signs a payload', () => {
      test('it has the JWT as a signature', () => {
        const options = { type: 'jwtVerifier' }
        const signature = signPayload({ payload, secret, options })

        expect(signature).toEqual(
          'eyJhbGciOiJIUzI1NiJ9.Tm8gbW9yZSBzZWNyZXRzLCBNYXJ0eS4.LBqlEwDa4bWxzrv_Y1_Y7S6_7czhzLZuF17d5c6YjXI'
        )
      })

      test('it signs and verifies', () => {
        const options = { type: 'jwtVerifier' }
        const signature = signPayload({ payload, secret, options })

        expect(
          verifySignature({ payload, secret, signature, options })
        ).toBeTruthy()
      })
    })
  })

  describe('webhooks via event', () => {
    describe('when it receives and event  extracts the signature and payload from the event', () => {
      test('it can verify an event body payload with a signature it generates', () => {
        const options = { type: 'timestampSchemeVerifier' }
        const signature = signPayload({ payload, secret, options })

        const event = buildEvent({
          payload,
          signature,
          signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
        })

        expect(verifyEvent({ event, secret, options })).toBeTruthy()
      })

      test('it can verify overriding the event body payload with a signature it generates', () => {
        const options = { type: 'timestampSchemeVerifier' }
        const signature = signPayload({ payload, secret, options })

        const event = buildEvent({
          payload: { body: payload },
          signature,
          signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
        })

        expect(verifyEvent({ event, payload, secret, options })).toBeTruthy()
      })

      test('it denies verification when signed with a different secret', () => {
        const options = { type: 'timestampSchemeVerifier' }
        const signature = signPayload({
          payload,
          secret: 'WERNER_BRANDES',
          options,
        })

        const event = buildEvent({
          payload,
          signature,
          signatureHeader: DEFAULT_WEBHOOK_SIGNATURE_HEADER,
        })

        expect(() => {
          verifyEvent({ event, secret, options })
        }).toThrow(WebhookVerificationError)
      })

      test('it verifies when within the timestamp tolerance', () => {
        const options = { type: 'timestampSchemeVerifier' }

        const signature = signPayload({
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
          verifyEvent({
            event,
            secret,
            options: { ...options, tolerance: 100_000 },
          })
        }).toBeTruthy()
      })

      test('it denies verification when verifying with a short tolerance', () => {
        const options = { type: 'timestampSchemeVerifier' }

        const signature = signPayload({
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
          verifyEvent({
            event,
            secret,
            options: { ...options, tolerance: 5_000 },
          })
        }).toThrow(WebhookVerificationError)
      })
    })
  })
})
