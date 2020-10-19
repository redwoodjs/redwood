/* eslint-disable @typescript-eslint/no-explicit-any */
import mockedAPIGatewayProxyEvent from './fixtures/apiGatewayProxyEvent.fixture'
import * as auth0Decoder from './../auth/decoders/auth0'
import * as netlifyDecoder from './../auth/decoders/netlify'
import { decodeToken } from './../auth/decoders/index'

jest.mock('./../auth/decoders/auth0', () => {
  return {
    auth0: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'auth0', fakeDecodedToken: true }
    }),
  }
})

jest.mock('./../auth/decoders/netlify', () => {
  return {
    netlify: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'netlify', fakeDecodedToken: true }
    }),
  }
})

const MOCKED_JWT = 'xxx.yyy.zzz'

describe('Uses correct Auth decoder', () => {
  it('handles auth0', async () => {
    const output = await decodeToken('auth0', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(auth0Decoder.auth0).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )
    expect(output).toEqual({
      decodedWith: 'auth0',
      fakeDecodedToken: true,
    })
  })

  it('decodes goTrue with netlify decoder', async () => {
    const output = await decodeToken('goTrue', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(netlifyDecoder.netlify).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )
    expect(output).toEqual({
      decodedWith: 'netlify',
      fakeDecodedToken: true,
    })
  })

  it('decodes netlify with netlify decoder', async () => {
    const output = await decodeToken('netlify', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(netlifyDecoder.netlify).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )
    expect(output).toEqual({
      decodedWith: 'netlify',
      fakeDecodedToken: true,
    })
  })

  it('returns undecoded token for custom', async () => {
    const output = await decodeToken('custom', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(output).toEqual(MOCKED_JWT)
  })

  it('returns undecoded token for magicLink', async () => {
    const output = await decodeToken('magicLink', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(output).toEqual(MOCKED_JWT)
  })

  it('returns undecoded token for firebase', async () => {
    const output = await decodeToken('firebase', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(output).toEqual(MOCKED_JWT)
  })

  it('returns undecoded token for supabase', async () => {
    const output = await decodeToken('supabase', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(output).toEqual(MOCKED_JWT)
  })

  it('returns undecoded token for unknown values', async () => {
    const output = await decodeToken('SOMETHING_ELSE!' as any, MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as any,
    })

    expect(output).toEqual(MOCKED_JWT)
  })
})
