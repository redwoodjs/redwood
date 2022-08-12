global.__dirname = __dirname

import '../../../../lib/mockTelemetry'

jest.mock('../../../../lib', () => {
  const path = require('path')
  const __dirname = path.resolve()

  return {
    getPaths: () => ({
      api: {
        src: path.join(__dirname, '../create-redwood-app/template/api/src'),
        functions: path.join(
          __dirname,
          '../create-redwood-app/template/api/src/functions'
        ),
        lib: path.join(__dirname, '../create-redwood-app/template/api/src/lib'),
      },
      web: { src: '' },
      base: path.join(__dirname, '../create-redwood-app/template'),
    }),
  }
})

jest.mock('../../../../lib/project', () => ({
  isTypeScriptProject: () => true,
}))

jest.mock('execa', () => {})
jest.mock('listr')
jest.mock('prompts', () => jest.fn(() => ({ answer: true })))

import fs from 'fs'

import listr from 'listr'
import prompts from 'prompts'

import * as auth from '../auth'

describe('Auth generator tests', () => {
  const processExitSpy = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => {})

  const mockListrRun = jest.fn()

  listr.mockImplementation(() => {
    return {
      run: mockListrRun,
    }
  })

  const fsSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})

  afterEach(() => {
    processExitSpy.mockReset()
    fsSpy.mockReset()
    prompts.mockClear()
    mockListrRun.mockClear()
  })

  it('Successfully executes the handler for Netlify', async () => {
    await auth.handler({ provider: 'netlify', webauthn: false, force: false })

    expect(mockListrRun).toHaveBeenCalledTimes(1)
    expect(processExitSpy).not.toHaveBeenCalledWith(1)
    expect(prompts).toHaveBeenCalledTimes(1)
    expect(prompts).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(
          /Overwrite existing [/\\]api[/\\]src[/\\]lib[/\\]auth.ts\?/
        ),
      })
    )
  })

  it('Successfully executes the handler for Netlify without prompting the user when --force is true', async () => {
    await auth.handler({ provider: 'netlify', webauthn: false, force: true })

    expect(mockListrRun).toHaveBeenCalledTimes(1)
    expect(processExitSpy).not.toHaveBeenCalledWith(1)
    expect(prompts).toHaveBeenCalledTimes(0)
  })

  it('Successfully executes the handler for dbAuth', async () => {
    await auth.handler({ provider: 'dbAuth', webauthn: false, force: false })

    expect(mockListrRun).toHaveBeenCalledTimes(1)
    expect(processExitSpy).not.toHaveBeenCalledWith(1)
    expect(prompts).toHaveBeenCalledTimes(1)
    expect(prompts).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Overwrite existing /api/src/lib/auth.ts?',
      })
    )
  })
})
