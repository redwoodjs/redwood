import MockProject from '@redwoodjs/test-mocks'

import {
  getConfig,
  DEFAULT_CONFIG,
  getConfigSides,
  getSideConfig,
} from '../config'

describe('config', () => {
  const mockrw = new MockProject()

  beforeEach(() => {
    mockrw.mock()
  })

  afterAll(() => {
    mockrw.restore()
  })

  describe('getConfig', () => {
    it('returns a default config', () => {
      expect(getConfig()).toEqual(DEFAULT_CONFIG)
    })

    it('the default config is merged with `redwood.toml`', () => {
      mockrw.setPaths((paths) => {
        paths['redwood.toml'] = `
          [web]
            port = 8080
          [api]
            port = 8081
        `
        return paths
      })
      const config = getConfig()
      expect(config.web.port).toEqual(8080)
      expect(config.api.port).toEqual(8081)
    })
  })

  describe('getConfigSides', () => {
    it('returns the config sides', () => {
      const sides = getConfigSides()
      mockrw.restore()
      expect(sides).toMatchSnapshot()
    })
  })

  describe('getSideConfig', () => {
    it('returns the correct side', () => {
      expect(getSideConfig('web').name).toEqual('web')
    })

    it('throws when you try to get a config that does not exist', () => {
      expect(() => getSideConfig('rambo')).toThrow()
    })
  })
})
