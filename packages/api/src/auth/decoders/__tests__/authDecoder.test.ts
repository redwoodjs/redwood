import type { Context as LambdaContext } from 'aws-lambda'

import type { SupportedAuthTypes } from '@redwoodjs/auth'

import mockedAPIGatewayProxyEvent from '../../../functions/fixtures/apiGatewayProxyEvent.fixture'
import * as auth0Decoder from '../auth0'
import * as clerkDecoder from '../clerk'
import * as firebaseDecoder from '../firebase'
import { decodeToken } from '../index'
import * as magiclinkDecoder from '../magicLink'
import * as netlifyDecoder from '../netlify'
import * as supabaseDecoder from '../supabase'

jest.mock('../auth0', () => {
  return {
    auth0: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'auth0', fakeDecodedToken: true }
    }),
  }
})

jest.mock('../clerk', () => {
  return {
    clerk: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'clerk', fakeDecodedToken: true }
    }),
  }
})

jest.mock('../firebase', () => {
  return {
    firebase: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'firebase', fakeDecodedToken: true }
    }),
  }
})

jest.mock('../magicLink', () => {
  return {
    firebase: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'magicLink', fakeDecodedToken: true }
    }),
  }
})

jest.mock('../netlify', () => {
  return {
    netlify: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'netlify', fakeDecodedToken: true }
    }),
  }
})

jest.mock('../supabase', () => {
  return {
    supabase: jest.fn().mockImplementation(async () => {
      return { decodedWith: 'supabase', fakeDecodedToken: true }
    }),
  }
})


const MOCKED_JWT = 'xxx.yyy.zzz'

describe('Uses correct Auth decoder', () => {
  it('handles auth0', async () => {
    const output = await decodeToken('auth0', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
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

  it('handles clerk', async () => {
    const output = await decodeToken('clerk', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
    })

    expect(clerkDecoder.clerk).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )
    expect(output).toEqual({
      decodedWith: 'clerk',
      fakeDecodedToken: true,
    })
  })

  it('decodes goTrue with netlify decoder', async () => {
    const output = await decodeToken('goTrue', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
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
      context: {} as LambdaContext,
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

  it('decodes magiclink with magiclink decoder', async () => {
    // process.env.MAGIC_SECRET_API_KEY = 'your_magic_secret'
    const output = await decodeToken('magicLink', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
    })
    expect(magiclinkDecoder.magicLink).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )

    expect(output).toEqual({
      decodedWith: 'magicLink',
      fakeDecodedToken: true,
    })
    // delete process.env['MAGIC_SECRET_API_KEY']
  })

  it('decodes firebase with firebase decoder', async () => {
    const output = await decodeToken('firebase', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
    })
    expect(firebaseDecoder.firebase).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )
    expect(output).toEqual({
      decodedWith: 'firebase',
      fakeDecodedToken: true,
    })
  })

  it('decodes supabase with supabase decoder', async () => {
    const output = await decodeToken('supabase', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
    })

    expect(supabaseDecoder.supabase).toHaveBeenCalledWith(
      MOCKED_JWT,
      expect.anything()
    )
    expect(output).toEqual({
      decodedWith: 'supabase',
      fakeDecodedToken: true,
    })
  })

  it('returns null as the decoded token for custom decoder', async () => {
    const output = await decodeToken('custom', MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
    })

    expect(output).toBeNull()
  })

  it('returns null as the decoded token for an unknown decoder', async () => {
    const output = await decodeToken('cli' as SupportedAuthTypes, MOCKED_JWT, {
      event: mockedAPIGatewayProxyEvent,
      context: {} as LambdaContext,
    })

    expect(output).toBeNull()
  })
})
