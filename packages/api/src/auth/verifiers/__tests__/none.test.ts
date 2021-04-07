import { createVerifier } from '../index'

const payload = 'No more secrets, Marty.'
const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

const { sign, verify } = createVerifier({
  options: { type: 'none' },
})

describe('none verifier', () => {
  describe('faux signs a payload', () => {
    test('it has an empty signature', () => {
      const signature = sign({ payload, secret })
      expect(signature).toEqual('')
    })

    test('it always verifies', () => {
      const signature = sign({ payload, secret })
      expect(verify({ payload, secret, signature })).toBeTruthy()
    })
  })
})
