import { vol } from 'memfs'

import { ensurePosixPath } from '@redwoodjs/project-config'

import {
  getCommonPlugins,
  getPathsFromTypeScriptConfig,
  parseTypeScriptConfigFiles,
} from '../common'

jest.mock('fs', () => require('memfs').fs)

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

afterEach(() => {
  vol.reset()
})

describe('common', () => {
  it("common plugins haven't changed unintentionally", () => {
    const commonPlugins = getCommonPlugins()

    expect(commonPlugins).toMatchInlineSnapshot(`
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
      ]
    `)
  })

  describe('TypeScript config files', () => {
    it("returns `null` if it can't find TypeScript config files", () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {},
          web: {},
        },
        redwoodProjectPath
      )

      const typeScriptConfig = parseTypeScriptConfigFiles()
      expect(typeScriptConfig).toHaveProperty('api', null)
      expect(typeScriptConfig).toHaveProperty('web', null)
    })

    it('finds and parses tsconfig.json files', () => {
      const apiTSConfig = '{"compilerOptions": {"noEmit": true}}'
      const webTSConfig = '{"compilerOptions": {"allowJs": true}}'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {
            'tsconfig.json': apiTSConfig,
          },
          web: {
            'tsconfig.json': webTSConfig,
          },
        },
        redwoodProjectPath
      )

      const typeScriptConfig = parseTypeScriptConfigFiles()
      expect(typeScriptConfig.api).toMatchObject(JSON.parse(apiTSConfig))
      expect(typeScriptConfig.web).toMatchObject(JSON.parse(webTSConfig))
    })

    it('finds and parses jsconfig.json files', () => {
      const apiJSConfig = '{"compilerOptions": {"noEmit": true}}'
      const webJSConfig = '{"compilerOptions": {"allowJs": true}}'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {
            'jsconfig.json': apiJSConfig,
          },
          web: {
            'jsconfig.json': webJSConfig,
          },
        },
        redwoodProjectPath
      )

      const typeScriptConfig = parseTypeScriptConfigFiles()
      expect(typeScriptConfig.api).toMatchObject(JSON.parse(apiJSConfig))
      expect(typeScriptConfig.web).toMatchObject(JSON.parse(webJSConfig))
    })

    describe('getPathsFromTypeScriptConfig', () => {
      it("returns an empty object if there's no TypeScript config files", () => {
        vol.fromNestedJSON(
          {
            'redwood.toml': '',
            api: {},
            web: {},
          },
          redwoodProjectPath
        )

        const typeScriptConfig = parseTypeScriptConfigFiles()

        const apiPaths = getPathsFromTypeScriptConfig(typeScriptConfig.api)
        expect(apiPaths).toMatchObject({})

        const webPaths = getPathsFromTypeScriptConfig(typeScriptConfig.web)
        expect(webPaths).toMatchObject({})
      })

      it("returns an empty object if there's no compilerOptions, baseUrl, or paths", () => {
        const apiTSConfig = '{}'
        const webTSConfig = '{"compilerOptions":{"allowJs": true}}'

        vol.fromNestedJSON(
          {
            'redwood.toml': '',
            api: {
              'tsconfig.json': apiTSConfig,
            },
            web: {
              'tsconfig.json': webTSConfig,
            },
          },
          redwoodProjectPath
        )

        const typeScriptConfig = parseTypeScriptConfigFiles()

        const apiPaths = getPathsFromTypeScriptConfig(typeScriptConfig.api)
        expect(apiPaths).toMatchInlineSnapshot(`{}`)

        const webPaths = getPathsFromTypeScriptConfig(typeScriptConfig.web)
        expect(webPaths).toMatchInlineSnapshot(`{}`)
      })

      it('excludes "src/*", "$api/*", "types/*", and "@redwoodjs/testing"', () => {
        const apiTSConfig =
          '{"compilerOptions":{"baseUrl":"./","paths":{"src/*":["./src/*","../.redwood/types/mirror/api/src/*"],"types/*":["./types/*","../types/*"],"@redwoodjs/testing":["../node_modules/@redwoodjs/testing/api"]}}}'
        const webTSConfig =
          '{"compilerOptions":{"baseUrl":"./","paths":{"src/*":["./src/*","../.redwood/types/mirror/web/src/*"],"$api/*":[ "../api/*" ],"types/*":["./types/*", "../types/*"],"@redwoodjs/testing":["../node_modules/@redwoodjs/testing/web"]}}}'

        vol.fromNestedJSON(
          {
            'redwood.toml': '',
            api: {
              'tsconfig.json': apiTSConfig,
            },
            web: {
              'tsconfig.json': webTSConfig,
            },
          },
          redwoodProjectPath
        )

        const typeScriptConfig = parseTypeScriptConfigFiles()

        const apiPaths = getPathsFromTypeScriptConfig(typeScriptConfig.api)
        expect(apiPaths).toMatchInlineSnapshot(`{}`)

        const webPaths = getPathsFromTypeScriptConfig(typeScriptConfig.web)
        expect(webPaths).toMatchInlineSnapshot(`{}`)
      })

      it('gets and formats paths', () => {
        const apiTSConfig =
          '{"compilerOptions":{"baseUrl":"./","paths":{"@services/*":["./src/services/*"]}}}'
        const webTSConfig =
          '{"compilerOptions":{"baseUrl":"./","paths":{"@ui/*":["./src/ui/*"]}}}'

        vol.fromNestedJSON(
          {
            'redwood.toml': '',
            api: {
              'tsconfig.json': apiTSConfig,
            },
            web: {
              'tsconfig.json': webTSConfig,
            },
          },
          redwoodProjectPath
        )

        const typeScriptConfig = parseTypeScriptConfigFiles()

        const apiPaths = getPathsFromTypeScriptConfig(typeScriptConfig.api)
        expect(ensurePosixPath(apiPaths['@services'])).toMatchInlineSnapshot(
          `"src/services"`
        )

        const webPaths = getPathsFromTypeScriptConfig(typeScriptConfig.web)
        expect(ensurePosixPath(webPaths['@ui'])).toMatchInlineSnapshot(
          `"src/ui"`
        )
      })
    })

    it('handles invalid JSON', () => {
      const apiTSConfig =
        '{"compilerOptions": {"noEmit": true,"allowJs": true,"esModuleInterop": true,"target": "esnext","module": "esnext","moduleResolution": "node","baseUrl": "./","rootDirs": ["./src","../.redwood/types/mirror/api/src"],"paths": {"src/*": ["./src/*","../.redwood/types/mirror/api/src/*"],"types/*": ["./types/*", "../types/*"],"@redwoodjs/testing": ["../node_modules/@redwoodjs/testing/api"]},"typeRoots": ["../node_modules/@types","./node_modules/@types"],"types": ["jest"],},"include": ["src","../.redwood/types/includes/all-*","../.redwood/types/includes/api-*","../types"]}'
      const webTSConfig =
        '{"compilerOptions": {"noEmit": true,"allowJs": true,"esModuleInterop": true,"target": "esnext","module": "esnext","moduleResolution": "node","baseUrl": "./","rootDirs": ["./src","../.redwood/types/mirror/web/src","../api/src","../.redwood/types/mirror/api/src"],"paths": {"src/*": ["./src/*","../.redwood/types/mirror/web/src/*","../api/src/*","../.redwood/types/mirror/api/src/*"],"$api/*": [ "../api/*" ],"types/*": ["./types/*", "../types/*"],"@redwoodjs/testing": ["../node_modules/@redwoodjs/testing/web"]},"typeRoots": ["../node_modules/@types", "./node_modules/@types"],"types": ["jest", "@testing-library/jest-dom"],"jsx": "preserve",},"include": ["src","../.redwood/types/includes/all-*","../.redwood/types/includes/web-*","../types","./types"]}'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {
            'tsconfig.json': apiTSConfig,
          },
          web: {
            'tsconfig.json': webTSConfig,
          },
        },
        redwoodProjectPath
      )

      expect(parseTypeScriptConfigFiles).not.toThrow()
    })
  })
})
