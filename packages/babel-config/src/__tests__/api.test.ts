import { vol } from 'memfs'

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
          "@babel/preset-typescript",
        ]
      `)
    })

    it('can include `@babel/preset-env`', () => {
      const apiSideBabelPresets = getApiSideBabelPresets({ presetEnv: true })
      expect(apiSideBabelPresets).toMatchInlineSnapshot(`
        [
          "@babel/preset-typescript",
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
      expect(apiSideBabelConfigPath).toMatchInlineSnapshot(
        `"/redwood-app/api/babel.config.js"`
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
      expect(apiSideBabelPlugins).toMatchInlineSnapshot(`
              [
                [
                  "@babel/plugin-transform-class-properties",
                  {
                    "loose": true,
                  },
                ],
                [
                  "@babel/plugin-transform-private-methods",
                  {
                    "loose": true,
                  },
                ],
                [
                  "@babel/plugin-transform-private-property-in-object",
                  {
                    "loose": true,
                  },
                ],
                [
                  "@babel/plugin-transform-runtime",
                  {
                    "corejs": {
                      "proposals": true,
                      "version": 3,
                    },
                    "version": "7.22.10",
                  },
                ],
                [
                  "babel-plugin-module-resolver",
                  {
                    "alias": {
                      "src": "./src",
                    },
                    "cwd": "packagejson",
                    "loglevel": "silent",
                    "root": [
                      "/redwood-app/api",
                    ],
                  },
                  "rwjs-api-module-resolver",
                ],
                [
                  [Function],
                  undefined,
                  "rwjs-babel-directory-named-modules",
                ],
                [
                  "babel-plugin-auto-import",
                  {
                    "declarations": [
                      {
                        "default": "gql",
                        "path": "graphql-tag",
                      },
                      {
                        "members": [
                          "context",
                        ],
                        "path": "@redwoodjs/graphql-server",
                      },
                    ],
                  },
                  "rwjs-babel-auto-import",
                ],
                [
                  "babel-plugin-graphql-tag",
                  undefined,
                  "rwjs-babel-graphql-tag",
                ],
                [
                  [Function],
                  undefined,
                  "rwjs-babel-glob-import-dir",
                ],
              ]
          `)
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
      expect(apiSideBabelPlugins).toMatchInlineSnapshot(`
        [
          [
            "@babel/plugin-transform-class-properties",
            {
              "loose": true,
            },
          ],
          [
            "@babel/plugin-transform-private-methods",
            {
              "loose": true,
            },
          ],
          [
            "@babel/plugin-transform-private-property-in-object",
            {
              "loose": true,
            },
          ],
          [
            "@babel/plugin-transform-runtime",
            {
              "corejs": {
                "proposals": true,
                "version": 3,
              },
              "version": "7.22.10",
            },
          ],
          [
            "babel-plugin-module-resolver",
            {
              "alias": {
                "src": "./src",
              },
              "cwd": "packagejson",
              "loglevel": "silent",
              "root": [
                "/redwood-app/api",
              ],
            },
            "rwjs-api-module-resolver",
          ],
          [
            [Function],
            undefined,
            "rwjs-babel-directory-named-modules",
          ],
          [
            "babel-plugin-auto-import",
            {
              "declarations": [
                {
                  "default": "gql",
                  "path": "graphql-tag",
                },
                {
                  "members": [
                    "context",
                  ],
                  "path": "@redwoodjs/graphql-server",
                },
              ],
            },
            "rwjs-babel-auto-import",
          ],
          [
            "babel-plugin-graphql-tag",
            undefined,
            "rwjs-babel-graphql-tag",
          ],
          [
            [Function],
            undefined,
            "rwjs-babel-glob-import-dir",
          ],
          [
            [Function],
            undefined,
            "rwjs-babel-otel-wrapping",
          ],
        ]
      `)
    })
  })
})
