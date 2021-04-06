import { createVerifier } from '../index'

const body = 'No more secrets, Marty.'
const secret = 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME'

const { sign, verify } = createVerifier({
  options: { type: 'none' },
})

describe('none', () => {
  describe('faux signs a payload', () => {
    test('it has an empty signature', () => {
      const signature = sign({ body, secret })
      expect(signature).toEqual('')
    })

    test('it always verifies', () => {
      const signature = sign({ body, secret })
      expect(verify({ body, secret, signature })).toBeTruthy()
    })
  })
})
