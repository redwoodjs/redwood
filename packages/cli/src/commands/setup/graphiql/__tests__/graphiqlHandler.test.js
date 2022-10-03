global.__dirname = __dirname

import '../../../../lib/mockTelemetry'

jest.mock('@redwoodjs/internal/dist/build/babel/api', () => {
  return {
    registerApiSideBabelHook: () => null,
  }
})
jest.mock('../../../../lib', () => ({
  getPaths: () => ({
    api: { lib: '', functions: '' },
  }),
  existsAnyExtensionSync: () => false,
}))
jest.mock('../../../../lib/project', () => ({
  isTypeScriptProject: () => false,
}))

jest.mock('listr2')
import chalk from 'chalk'
import { Listr } from 'listr2'

import * as graphiql from '../graphiql'

describe('Graphiql generator tests', () => {
  const processExitSpy = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => {})
  const cSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  const mockListrRun = jest.fn()
  Listr.mockImplementation(() => {
    return {
      run: mockListrRun,
    }
  })

  afterEach(() => {
    processExitSpy.mockReset()
    cSpy.mockReset()
  })

  it('throws an error if source path does not exist when viewing headers', async () => {
    jest.spyOn(graphiql, 'getOutputPath').mockImplementation(() => '')
    await graphiql.handler({ view: true, provider: 'dbAuth' })
    expect(console.error).toHaveBeenCalledWith(
      chalk.bold.red(
        'Must run yarn rw setup graphiql <provider> to generate headers before viewing'
      )
    )
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })

  it('throws an error if auth provider is dbAuth and no user id is provided', () => {
    try {
      graphiql.generatePayload('dbAuth')
    } catch (e) {
      expect(e.message).toBe('Require an unique id to generate session cookie')
    }
  })

  it('throws an error if auth provider is dbAuth and no supabase env is set', () => {
    process.env.SESSION_SECRET = null
    try {
      graphiql.generatePayload('dbAuth', 'user-id-123')
    } catch (e) {
      expect(e.message).toBe(
        'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
      )
    }
  })

  it('returns a payload if a token is provided', async () => {
    const provider = 'supabase'
    const token = 'mock-token'
    const response = graphiql.generatePayload(provider, null, token)
    expect(response).toEqual({
      'auth-provider': provider,
      authorization: `Bearer ${token}`,
    })
  })
})
