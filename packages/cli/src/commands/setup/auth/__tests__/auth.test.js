global.__dirname = __dirname

jest.mock('fs')
jest.mock('src/lib', () => ({
  getPaths: () => ({
    api: { functions: '', src: '', lib: '' },
    web: { src: '' },
  }),
}))

jest.mock('execa')
jest.mock('listr')

import fs from 'fs'

import { waitFor } from '@testing-library/react'
import chalk from 'chalk'
import listr from 'listr'

import * as auth from '../auth'

const EXISTING_AUTH_PROVIDER_ERROR =
  'Existing auth provider found.\nUse --force to override existing provider.'

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

  afterEach(() => {
    processExitSpy.mockReset()
  })

  it(`no error thrown when auth provider not found`, async () => {
    const fsSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => '')

    // Mock process.exit to make sure CLI quites
    const cSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    await auth.handler({ provider: 'netlify' })
    expect(console.log).not.toHaveBeenCalledWith(
      chalk.bold.red(EXISTING_AUTH_PROVIDER_ERROR)
    )

    expect(mockListrRun).toHaveBeenCalled()
    expect(processExitSpy).not.toHaveBeenCalledWith(1)

    // Restore mocks
    fsSpy.mockRestore()
    cSpy.mockRestore()
  })

  it('throws an error if auth provider exists', async () => {
    // Mock process.exit to make sure CLI quites
    const fsSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(
        () => `import { AuthProvider } from '@redwoodjs/auth'`
      )

    const cSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    await auth.handler({ provider: 'netlify' })
    expect(console.log).toHaveBeenCalledWith(
      chalk.bold.red(EXISTING_AUTH_PROVIDER_ERROR)
    )

    expect(processExitSpy).toHaveBeenCalledWith(1)

    // Restore mocks
    fsSpy.mockRestore()
    cSpy.mockRestore()
  })
})
