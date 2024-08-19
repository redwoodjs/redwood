import {
  beforeAll,
  describe,
  expect,
  beforeEach,
  afterEach,
  vi,
  it,
} from 'vitest'

import {
  EXPIRES_IN,
  generateSignature,
  validateSignature,
} from '../lib/signedUrls.js'

describe('Signed URLs', () => {
  beforeAll(() => {
    process.env.RW_UPLOADS_SECRET = 'bazinga'
  })

  it('Can creates a signature', () => {
    const { signature, expires } = generateSignature(
      '/tmp/myfile.txt',
      EXPIRES_IN.days(5),
    )

    expect(signature).toBeDefined()

    expect(diffInDaysFromNow(expires as number)).toBeCloseTo(5)
  })

  it('throws with correct error when wrong expires passed', () => {
    const { signature, expires } = generateSignature(
      '/tmp/myfile.txt',
      EXPIRES_IN.days(1),
    )

    expect(() =>
      validateSignature({
        filePath: '/tmp/myfile.txt',
        signature,
        expires,
      }),
    ).not.toThrow()

    expect(() =>
      validateSignature({
        filePath: '/tmp/myfile.txt',
        signature,
        expires: 12512351,
      }),
    ).toThrowError('Signature has expired')
  })

  it('Throws an invalid signature when signature is wrong', () => {
    const { signature, expires } = generateSignature(
      '/tmp/myfile.txt',
      EXPIRES_IN.days(1),
    )

    expect(() =>
      validateSignature({
        filePath: '/tmp/myfile.txt',
        signature,
        expires,
      }),
    ).not.toThrow()

    expect(() =>
      validateSignature({
        filePath: '/tmp/myfile.txt',
        signature: 'im-the-wrong-signature',
        expires,
      }),
    ).toThrowError('Invalid signature')
  })

  it('Throws an invalid signature when file path is wrong', () => {
    const { signature, expires } = generateSignature(
      '/tmp/myfile.txt',
      EXPIRES_IN.days(20),
    )
    expect(() =>
      validateSignature({
        filePath: '/tmp/some-other-file.txt',
        signature,
        expires,
      }),
    ).toThrowError('Invalid signature')
  })
})

describe('Expired signature', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws an error when the signature has expired', () => {
    const filePath = '/bazinga/kittens.png'
    const { signature, expires } = generateSignature(
      filePath,
      EXPIRES_IN.minutes(15),
    )

    const validation = () =>
      validateSignature({
        filePath,
        signature,
        expires,
      })

    expect(validation).not.toThrow()

    // Time travel to the future
    vi.advanceTimersByTime(EXPIRES_IN.days(1))

    expect(validation).toThrowError('Signature has expired')
  })
})

// Some utility function to make tests more readable
function diffInMinsFromNow(time: number) {
  return Math.abs(time - Date.now()) / 60000
}

function diffInDaysFromNow(time: number) {
  return Math.abs(time - Date.now()) / 86400000
}
