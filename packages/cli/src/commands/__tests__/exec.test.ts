import path from 'node:path'

import '../../lib/mockTelemetry'

import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest'

import { handler } from '../execHandler'

vi.mock('envinfo', () => ({ default: { run: () => '' } }))
vi.mock('@redwoodjs/project-config', () => ({
  getPaths: () => ({
    scripts: path.join(__dirname, '../../../../../__fixtures__/test-project/scripts'),
  }),
  resolveFile: (path: string) => path
}))

const mockRedwoodToml = {
  fileContents: '',
}

// Before rw tests run, api/ and web/ `jest.config.js` is confirmed via existsSync()
vi.mock('node:fs', async () => ({
  default: {
    readFileSync: () => {
      return mockRedwoodToml.fileContents
    },
  },
}))

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.mocked(console).log.mockRestore()
})

describe('yarn rw exec --list', () => {
  it('includes nested scripts', async () => {
    await handler({ list: true })
    expect(vi.mocked(console).log).toHaveBeenCalledWith(
      expect.stringContaining(
        'one' + path.sep + 'two' + path.sep + 'myNestedScript'
      )
    )
  })
})
