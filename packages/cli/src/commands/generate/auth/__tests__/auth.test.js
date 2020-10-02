global.__dirname = __dirname

import {
  waitFor,
} from '@testing-library/react'

jest.mock('fs')
jest.mock('src/lib', () => ({
  getPaths: () => ({
    api: { functions: '', src: '', lib: '' },
    web: { src: '' },
  }),
}))

import fs from 'fs'
import chalk from 'chalk'

import * as auth from '../auth'

test(`no error thrown when auth provider not found`, async () => {
  // Mock process.exit to make sure CLI quites
  const cSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  auth.handler({ provider: 'netlify' })
  await waitFor(() => expect(console.log).toHaveBeenCalledTimes(1))
  expect(console.log).not.toHaveBeenCalledWith(chalk.bold.red('Existing auth provider found'))

  // Restore mocks
  cSpy.mockRestore()
})

test('throws an error if auth provider exists', async () => {
  // Mock process.exit to make sure CLI quites
  const fsSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => `import { AuthProvider } from '@redwoodjs/auth'`)
  const cSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  auth.handler({ provider: 'netlify' })
  await waitFor(() => expect(console.log).toHaveBeenCalledTimes(1))
  expect(console.log).toHaveBeenCalledWith(chalk.bold.red('Existing auth provider found\nUse --force to override existing provider.'))

  // Restore mocks
  fsSpy.mockRestore()
  cSpy.mockRestore()
})
