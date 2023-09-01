import { vol } from 'memfs'

import { getPaths, ensurePosixPath } from '@redwoodjs/project-config'

import {
  getApiSideBabelConfigPath,
  getApiSideBabelPlugins,
  getApiSideBabelPresets,
  TARGETS_NODE,
} from '../api'

jest.mock('fs', () => require('memfs').fs)

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

afterEach(() => {
  vol.reset()
})

describe('api', () => {
  test("TARGETS_NODE hasn't unintentionally changed", () => {
    expect(TARGETS_NODE).toMatchInlineSnapshot(`"18.16"`)
  })

  describe('getApiSideBabelPresets', () => {
    it('just includes `@babel/preset-typescript` by default', () => {
      const apiSideBabelPresets = getApiSideBabelPresets()
      expect(apiSideBabelPresets).toMatchInlineSnapshot(`
        [
          [
            "@babel/preset-typescript",
            {
              "allExtensions": true,
              "isTSX": true,
            },
            "rwjs-babel-preset-typescript",
          ],
        ]
      `)
    })

    it('can include `@babel/preset-env`', () => {
      const apiSideBabelPresets = getApiSideBabelPresets({ presetEnv: true })
      expect(apiSideBabelPresets).toMatchInlineSnapshot(`
        [
          [
            "@babel/preset-typescript",
            {
              "allExtensions": true,
              "isTSX": true,
            },
            "rwjs-babel-preset-typescript",
          ],
          [
            "@babel/preset-env",
            {
              "corejs": {
                "proposals": true,
                "version": "3.32",
              },
              "exclude": [
                "@babel/plugin-transform-class-properties",
                "@babel/plugin-transform-private-methods",
              ],
              "targets": {
                "node": "18.16",
              },
              "useBuiltIns": "usage",
            },
          ],
        ]
      `)
    })
  })

  describe('getApiSideBabelConfigPath', () => {
    it("gets babel.config.js if it's there", () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {
            'babel.config.js': '',
          },
        },
        redwoodProjectPath
      )

      const apiSideBabelConfigPath = getApiSideBabelConfigPath()
      expect(ensurePosixPath(apiSideBabelConfigPath)).toMatch(
        '/redwood-app/api/babel.config.js'
      )
    })

    it("returns undefined if it's not there", () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {},
        },
        redwoodProjectPath
      )

      const apiSideBabelConfigPath = getApiSideBabelConfigPath()
      expect(apiSideBabelConfigPath).toBeUndefined()
    })
  })

  describe('getApiSideBabelPlugins', () => {
    it('returns babel plugins', () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {},
        },
        redwoodProjectPath
      )

      const apiSideBabelPlugins = getApiSideBabelPlugins()
      expect(apiSideBabelPlugins).toHaveLength(9)

      const pluginNames = apiSideBabelPlugins.map(([name]) => name)
      expect(pluginNames).toMatchInlineSnapshot(`
        [
          "@babel/plugin-transform-class-properties",
          "@babel/plugin-transform-private-methods",
          "@babel/plugin-transform-private-property-in-object",
          "@babel/plugin-transform-runtime",
          "babel-plugin-module-resolver",
          [Function],
          "babel-plugin-auto-import",
          "babel-plugin-graphql-tag",
          [Function],
        ]
      `)

      const pluginAliases = getPluginAliases(apiSideBabelPlugins)
      expect(pluginAliases).toMatchInlineSnapshot(`
        [
          "rwjs-api-module-resolver",
          "rwjs-babel-directory-named-modules",
          "rwjs-babel-auto-import",
          "rwjs-babel-graphql-tag",
          "rwjs-babel-glob-import-dir",
        ]
      `)

      expect(apiSideBabelPlugins).toContainEqual([
        '@babel/plugin-transform-class-properties',
        {
          loose: true,
        },
      ])

      expect(apiSideBabelPlugins).toContainEqual([
        '@babel/plugin-transform-private-methods',
        {
          loose: true,
        },
      ])

      expect(apiSideBabelPlugins).toContainEqual([
        '@babel/plugin-transform-private-property-in-object',
        {
          loose: true,
        },
      ])

      expect(apiSideBabelPlugins).toContainEqual([
        '@babel/plugin-transform-runtime',
        {
          corejs: {
            proposals: true,
            version: 3,
          },
          version: '7.22.11',
        },
      ])

      const [_, babelPluginModuleResolverConfig] = apiSideBabelPlugins.find(
        (plugin) => plugin[0] === 'babel-plugin-module-resolver'
      )

      expect(babelPluginModuleResolverConfig).toMatchObject({
        alias: {
          src: './src',
        },

        cwd: 'packagejson',
        loglevel: 'silent', // to silence the unnecessary warnings
      })

      expect(babelPluginModuleResolverConfig.root[0]).toMatch(
        getPaths().api.base
      )

      expect(apiSideBabelPlugins).toContainEqual([
        'babel-plugin-auto-import',
        {
          declarations: [
            {
              default: 'gql',
              path: 'graphql-tag',
            },
            {
              members: ['context'],
              path: '@redwoodjs/graphql-server',
            },
          ],
        },
        'rwjs-babel-auto-import',
      ])
    })

    it('can include openTelemetry', () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {},
        },
        redwoodProjectPath
      )

      const apiSideBabelPlugins = getApiSideBabelPlugins({
        openTelemetry: true,
      })
      const pluginAliases = getPluginAliases(apiSideBabelPlugins)
      expect(pluginAliases).toContain('rwjs-babel-otel-wrapping')
    })
  })
})

function getPluginAliases(plugins) {
  return plugins.reduce((pluginAliases, plugin) => {
    if (plugin.length !== 3) {
      return pluginAliases
    }

    return [...pluginAliases, plugin[2]]
  }, [])
}
