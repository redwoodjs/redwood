import mockfs from 'mock-fs'

import {
  getConfig,
  DEFAULT_CONFIG,
  getConfigSides,
  getSideConfig,
} from './config'

describe('config', () => {
  describe('getConfig', () => {
    it('has defaults', () => {
      // Call `console.log` before mocking the file-system:
      // https://github.com/tschaub/mock-fs/issues/234
      // console.log('')
      mockfs({
        'redwood.toml': '',
      })

      expect(getConfig()).toEqual(DEFAULT_CONFIG)
    })

    it('default config merges with `redwood.toml`', () => {
      // Call `console.log` before mocking the file-system:
      // https://github.com/tschaub/mock-fs/issues/234
      // console.log('')
      const toml = `
      [web]
        port = 8080
      [api]
        port = 8081
    `
      mockfs({
        'redwood.toml': toml,
      })

      const config = getConfig()
      expect(config.web.port).toEqual(8080)
      expect(config.api.port).toEqual(8081)
    })

    describe('getConfigSides', () => {
      mockfs({
        'redwood.toml': '',
      })

      expect(getConfigSides()).toEqual({
        api: {
          build: [
            {
              command: 'NODE_ENV=production babel src --out-dir dist',
              destination: './dist',
              name: 'default',
              source: './src',
            },
          ],
          host: 'localhost',
          name: 'api',
          path: './api',
          port: 8911,
          target: 'node',
        },
        web: {
          apiProxyPath: './netlify/functions',
          apiProxyPort: 8911,
          build: [
            {
              command:
                'yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.production.js',
              destination: './dist',
              name: 'default',
              source: './src',
            },
            {
              command:
                'yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.stats.js',
              destination: './dist',
              name: 'stats',
              source: './src',
            },
          ],
          host: 'localhost',
          name: 'web',
          path: './web',
          port: 8910,
          target: 'browser',
        },
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

  afterAll(() => {
    mockfs.restore()
  })
})
