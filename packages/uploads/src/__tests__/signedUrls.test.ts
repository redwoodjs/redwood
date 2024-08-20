import { describe, expect, beforeEach, afterEach, vi, it, test } from 'vitest'

import {
  EXPIRES_IN,
  UrlSigner,
  getSignedDetailsFromUrl,
} from '../lib/signedUrls.js'

const signer = new UrlSigner({
  // Doing this means we don't need to mock getConfig
  endpoint: 'https://myapiside.com/access-signed-file',
  secret: 'bazinga-3-32-151',
})

describe('UrlSigner', () => {
  it('Can creates a signature', () => {
    const { signature, expiry: expires } = signer.generateSignature({
      filePath: '/tmp/myfile.txt',
      expiresInMs: EXPIRES_IN.days(5),
    })

    expect(signature).toBeDefined()

    expect(diffInDaysFromNow(expires as number)).toBeCloseTo(5)
  })

  it('throws with correct error when wrong expires passed', () => {
    const { signature, expiry: expires } = signer.generateSignature({
      filePath: '/tmp/myfile.txt',
      expiresInMs: EXPIRES_IN.days(1),
    })

    expect(() =>
      signer.validateSignature({
        filePath: '/tmp/myfile.txt',
        signature,
        expiry: expires,
      }),
    ).not.toThrow()

    expect(() =>
      signer.validateSignature({
        filePath: '/tmp/myfile.txt',
        signature,
        expiry: 12512351,
      }),
    ).toThrowError('Signature has expired')
  })

  it('Throws an invalid signature when signature is wrong', () => {
    const { signature, expiry } = signer.generateSignature({
      filePath: '/tmp/myfile.txt',
      expiresInMs: EXPIRES_IN.days(1),
    })

    expect(() =>
      signer.validateSignature({
        filePath: '/tmp/myfile.txt',
        signature,
        expiry,
      }),
    ).not.toThrow()

    expect(() =>
      signer.validateSignature({
        filePath: '/tmp/myfile.txt',
        signature: 'im-the-wrong-signature',
        expiry,
      }),
    ).toThrowError('Invalid signature')
  })

  it('Throws an invalid signature when file path is wrong', () => {
    const { signature, expiry } = signer.generateSignature({
      filePath: '/tmp/myfile.txt',
      expiresInMs: EXPIRES_IN.days(20),
    })
    expect(() =>
      signer.validateSignature({
        filePath: '/tmp/some-other-file.txt',
        signature,
        expiry,
      }),
    ).toThrowError('Invalid signature')
  })
})

describe('Expired signature', () => {
  // Seprate, so we can mock the times
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws an error when the signature has expired', () => {
    const filePath = '/bazinga/kittens.png'
    const { signature, expiry } = signer.generateSignature({
      filePath,
      expiresInMs: EXPIRES_IN.minutes(15),
    })

    const validation = () =>
      signer.validateSignature({
        filePath,
        signature,
        expiry,
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
  const signedUrl = signer.generateSignedUrl(
    '/files/bazinga',
    EXPIRES_IN.days(1),
  )

  expect(signedUrl).toContain('https://myapiside.com/access-signed-file?s=')
  expect(signedUrl).toMatch(/s=.*/)
  expect(signedUrl).toMatch(/expires=[0-9]+/)
  expect(signedUrl).toContain(`path=${encodeURIComponent('/files/bazinga')}`) // The actual file path
})

// Util functions to make the tests more readable
function diffInDaysFromNow(time: number) {
  return Math.abs(time - Date.now()) / 86400000
}
