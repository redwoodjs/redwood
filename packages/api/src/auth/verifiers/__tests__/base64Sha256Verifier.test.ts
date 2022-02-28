import { createVerifier, WebhookVerificationError } from '../index'

const stringPayload = 'No more secrets, Marty.'
const payload = { data: { move: 'Sneakers', quote: stringPayload } }
const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

const { sign, verify } = createVerifier('base64Sha256Verifier')

describe('base64 sha256 verifier', () => {
  describe('signs a payload with the sha256 algorithm', () => {
    test('it verifies when signed and verified with same secret', () => {
      const signature = sign({ payload, secret })
      expect(verify({ payload, secret, signature })).toBeTruthy()
    })

    test('it denies verification if signature does not represent the secret signed payload', () => {
      const signature =
        'sha265=819468bd4f892c51d2aee3b0842afc2e397d3798d1be0ca9b89273c3f97b1b7a'
      expect(() => {
        verify({ payload, secret, signature })
      }).toThrow(WebhookVerificationError)
    })

    test('it denies verification if the secret used to sign does not match the signature', () => {
      const signature = sign({
        payload,
        secret: 'I_LEAVE_MESSAGE_HERE_ON_SERVICE_BUT_YOU_DO_NOT_CALL',
      })

      expect(() => {
        verify({ payload, secret, signature })
      }).toThrow(WebhookVerificationError)
    })
  })

  describe('signs a string payload with the sha256 algorithm', () => {
    test('it verifies when signed and verified with same secret', () => {
      const signature = sign({ payload: stringPayload, secret })
      expect(verify({ payload: stringPayload, secret, signature })).toBeTruthy()
    })

    test('it denies verification if signature does not represent the secret signed payload', () => {
      const signature =
        'sha265=819468bd4f892c51d2aee3b0842afc2e397d3798d1be0ca9b89273c3f97b1b7a'
      expect(() => {
        verify({ payload: stringPayload, secret, signature })
      }).toThrow(WebhookVerificationError)
    })

    test('it denies verification if the secret used to sign does not match the signature', () => {
      const signature = sign({
        payload: stringPayload,
        secret: 'I_LEAVE_MESSAGE_HERE_ON_SERVICE_BUT_YOU_DO_NOT_CALL',
      })

      expect(() => {
        verify({ payload: stringPayload, secret, signature })
      }).toThrow(WebhookVerificationError)
    })
  })

  describe('provider specific tests', () => {
    test('clerk', () => {
      const { verify } = createVerifier('base64Sha256Verifier', {
        signatureTransformer: (signature: string) => {
          // Clerk can pass a space separated list of signatures.
          // Let's just use the first one that's of version 1
          const passedSignatures = signature.split(' ')

          for (const versionedSignature of passedSignatures) {
            const [version, signature] = versionedSignature.split(',')

            if (version === 'v1') {
              return signature
            }
          }
        },
      })

      const event = {
        headers: {
          'svix-signature': 'v1,AaP4EgcpPC5oE3eppI/s6EMtQCZ4Ap34wNHPoxBoikI=',
          'svix-timestamp': '1646004463',
          'svix-id': 'msg_25hz5cPxRz5ilWSQSiYfgxpYHTH',
        },
        body: '{"data": {"abandon_at": 1648585920141, ' +
          '"client_id": "client_25hz3vm5USqCG3a7jMXqdjzjJyK", ' +
          '"created_at": 1645993920141, "expire_at": 1646598720141, ' +
          '"id": "sess_25hz5CxFyrNJgDO1TY52LGPtM0e", ' +
          '"last_active_at": 1645993920141, "object": "session", ' +
          '"status": "active", "updated_at": 1645993920149, ' +
          '"user_id": "user_25h1zRMh7owJp6us0Sqs3UXwW0y"}, ' +
          '"object": "event", "type": "session.created"}',
      }

      const svix_id = event.headers['svix-id']
      const svix_timestamp = event.headers['svix-timestamp']

      const payload = `${svix_id}.${svix_timestamp}.${event.body}`
      const secret = 'whsec_MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'.slice(6)
      const signature = event.headers['svix-signature']

      expect(verify({ payload, secret, signature })).toBeTruthy()
    })
  })
})
