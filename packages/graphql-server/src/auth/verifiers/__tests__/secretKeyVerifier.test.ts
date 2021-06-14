import { createVerifier, WebhookVerificationError } from '../index'

const payload = 'No more secrets, Marty.'
const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

const { sign, verify } = createVerifier('secretKeyVerifier')

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(jest.fn())
})

afterEach(() => {
  jest.spyOn(console, 'warn').mockRestore()
})

describe('secretKey verifier', () => {
  describe('faux signs a payload', () => {
    test('a signature is the secret itself', () => {
      const signature = sign({ payload, secret })
      expect(signature).toEqual(secret)
    })

    test('it verifies that the secret and signature are identical', () => {
      jest.spyOn(console, 'warn').mockImplementation(jest.fn())
      const signature = sign({ payload, secret })
      expect(verify({ payload, secret, signature })).toBeTruthy()
      jest.spyOn(console, 'warn').mockRestore()
    })

    test('it denies verification if the secret and signature are not the same', () => {
      const signature = 'I_LEAVE_MESSAGE_HERE_ON_SERVICE_BUT_YOU_DO_NOT_CALL'
      expect(() => {
        verify({ payload, secret, signature })
      }).toThrow(WebhookVerificationError)
    })
  })
})
