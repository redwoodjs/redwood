import mockfs from 'mock-fs'

import { getArgsForSide } from './cli'

describe('cli', () => {
  mockfs({
    '/path/to/project': {
      'redwood.toml': '',
    },
  })

  describe('getArgsForSide', () => {
    it('supplies the appropriate options to the dev server', () => {
      expect(getArgsForSide('api')).toEqual({
        functionsPath: '/path/to/project/api/src/functions',
        host: 'localhost',
        port: 8911,
        watchPath: '/path/to/project/api',
      })
    })
  })

  afterAll(() => {
    jest.clearAllMocks()
    mockfs.restore()
  })
})
