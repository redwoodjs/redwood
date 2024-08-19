import {
  beforeAll,
  describe,
  expect,
  beforeEach,
  afterEach,
  vi,
  it,
  test,
} from 'vitest'

import {
  EXPIRES_IN,
  generateSignature,
  generateSignedQueryParams,
  getSignedDetailsFromUrl,
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

test('Parses details related to signatures from a url string', () => {
  const url =
    'https://example.com/signedFile?file=/path/to/hello.txt&s=s1gnatur3&expires=123123'

  const { file, signature, expires } = getSignedDetailsFromUrl(url)

  expect(file).toBe('/path/to/hello.txt')
  expect(signature).toBe('s1gnatur3')
  expect(expires).toBe(123123)
})

test('Generates a signed url', () => {
  const signedQueryParams = generateSignedQueryParams('/files/bazinga', {
    filePath: '/path/to/hello.txt',
    expiresIn: EXPIRES_IN.days(1),
  })

  expect(signedQueryParams).toContain('/files/bazinga?s=')
  expect(signedQueryParams).toContain('s=')
  expect(signedQueryParams).toContain('expires=')
  expect(signedQueryParams).toContain('path=') // The actual file path
})

// Util functions to make the tests more readable
function diffInDaysFromNow(time: number) {
  return Math.abs(time - Date.now()) / 86400000
}
