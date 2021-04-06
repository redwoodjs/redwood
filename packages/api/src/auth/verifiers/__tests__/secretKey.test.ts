import { createVerifier, WebhookVerificationError } from '../index'

const body = 'No more secrets, Marty.'
const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

const { sign, verify } = createVerifier({
  options: { type: 'secretKey' },
})

describe('secretKey verifier', () => {
  describe('faux signs a payload', () => {
    test('a signature is the secret itself', () => {
      const signature = sign({ body, secret })
      expect(signature).toEqual(secret)
    })

    test('it verifies that the secret and signature are identical', () => {
      const signature = sign({ body, secret })
      expect(verify({ body, secret, signature })).toBeTruthy()
    })

    test('it denies verification if the secret and signature are not the same', () => {
      const signature = 'I_LEAVE_MESSAGE_HERE_ON_SERVICE_BUT_YOU_DO_NOT_CALL'
      expect(() => {
        verify({ body, secret, signature })
      }).toThrow(WebhookVerificationError)
    })
  })
})
