global.__dirname = __dirname

// mock Telemetry for CLI commands so they don't try to spawn a process
jest.mock('@redwoodjs/telemetry', () => {
  return {
    errorTelemetry: () => jest.fn(),
    timedTelemetry: () => jest.fn(),
  }
})

jest.mock('../../lib/paths', () => {
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

jest.mock('../../lib/project', () => ({
  isTypeScriptProject: () => true,
}))

jest.mock('execa', () => {})
jest.mock('listr2')
jest.mock('prompts', () => jest.fn(() => ({ answer: true })))

import fs from 'fs'
import path from 'path'

import { Listr } from 'listr2'
import prompts from 'prompts'

// import * as auth from '../auth'
import { standardAuthHandler } from '../setupHelpers'

describe('Auth generator tests', () => {
  const processExitSpy = jest
    .spyOn<NodeJS.Process, any>(process, 'exit')
    .mockImplementation((_code: any) => {})

  const mockListrRun = jest.fn()

  ;(Listr as jest.MockedFunction<jest.Mock>).mockImplementation(() => {
    return {
      run: mockListrRun,
    }
  })

  const fsSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})

  afterEach(() => {
    processExitSpy.mockReset()
    fsSpy.mockReset()
    ;(prompts as unknown as jest.Mock).mockClear()
    mockListrRun.mockClear()
  })

  it('Successfully executes the handler for Netlify', async () => {
    await standardAuthHandler({
      basedir: path.join(__dirname, 'fixtures/supertokensSetup'),
      rwVersion: '1.2.3',
      provider: 'supertokens',
      webAuthn: false,
      forceArg: false,
    })

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
    await standardAuthHandler({
      basedir: path.join(__dirname, 'fixtures/supertokensSetup'),
      rwVersion: '1.2.3',
      provider: 'supertokens',
      webAuthn: false,
      forceArg: true,
    })

    expect(mockListrRun).toHaveBeenCalledTimes(1)
    expect(processExitSpy).not.toHaveBeenCalledWith(1)
    expect(prompts).toHaveBeenCalledTimes(0)
  })

  it('Successfully executes the handler for dbAuth', async () => {
    await standardAuthHandler({
      basedir: path.join(__dirname, 'fixtures/dbAuthSetup'),
      rwVersion: '1.2.3',
      provider: 'dbAuth',
      webAuthn: false,
      forceArg: false,
    })

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
})
