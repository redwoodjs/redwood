// Have to use `var` here to avoid "Temporal Dead Zone" issues
// eslint-disable-next-line
var mockWebAppPath = ''
// eslint-disable-next-line
var mockWebRoutesPath = ''
// eslint-disable-next-line
var mockApiGraphqlPath = ''

import fs from 'fs'
import path from 'path'

// mock Telemetry for CLI commands so they don't try to spawn a process
jest.mock('@redwoodjs/telemetry', () => {
  return {
    errorTelemetry: () => jest.fn(),
    timedTelemetry: () => jest.fn(),
  }
})

import {
  addApiConfig,
  addConfigToApp,
  addConfigToRoutes,
  createWebAuth,
} from '../authTasks'

jest.mock('../../lib/paths', () => {
  const path = require('path')
  const __dirname = path.resolve()
  const originalModule = jest.requireActual('../../lib/paths')

  return {
    resolveFile: originalModule.resolveFile,
    getPaths: () => ({
      api: { functions: '', src: '', lib: '' },
      web: {
        src: path.join(__dirname, '../create-redwood-app/template/web/src'),
        app: path.join(
          __dirname,
          mockWebAppPath || '../create-redwood-app/template/web/src/App.tsx'
        ),
        routes: path.join(
          __dirname,
          mockWebRoutesPath ||
            '../create-redwood-app/template/web/src/Routes.tsx'
        ),
      },
      base: path.join(__dirname, '../create-redwood-app/template'),
    }),
  }
})

jest.mock('../../lib/project', () => {
  const path = require('path')
  const __dirname = path.resolve()

  return {
    isTypeScriptProject: () => false,
    getGraphqlPath: () => {
      const graphqlPath = path.join(
        __dirname,
        mockApiGraphqlPath ||
          '../create-redwood-app/template/api/src/functions/graphql.ts'
      )
      return graphqlPath
    },
  }
})

// This function checks output matches
const writeFileSyncSpy = jest.fn((_, content) => {
  expect(content).toMatchSnapshot()
})

beforeEach(() => {
  mockWebAppPath = ''
  jest.restoreAllMocks()
  jest.spyOn(fs, 'writeFileSync').mockImplementation(writeFileSyncSpy)
})

describe('authTasks', () => {
  it('Should update App.{js,tsx}, Routes.{js,tsx} and add auth.ts (Auth0)', () => {
    addConfigToApp()
    createWebAuth(path.join(__dirname, 'fixtures/dbAuthSetup'), 'auth0', false)
    addConfigToRoutes()
  })

  it('Should update App.{js,tsx}, Routes.{js,tsx} and add auth.ts (Clerk)', () => {
    addConfigToApp()
    createWebAuth(path.join(__dirname, 'fixtures/dbAuthSetup'), 'clerk', false)
    addConfigToRoutes()
  })

  describe('Components with props', () => {
    it('Should add useAuth on the same line for single line components, and separate line for multiline components', () => {
      mockWebAppPath =
        'src/auth/__tests__/fixtures/AppWithCustomRedwoodApolloProvider.js'
      mockWebRoutesPath =
        'src/auth/__tests__/fixtures/RoutesWithCustomRouterProps.tsx'

      addConfigToApp()
      addConfigToRoutes()
    })

    it('Should not add useAuth if one already exists', () => {
      mockWebAppPath =
        'src/auth/__tests__/fixtures/AppWithCustomRedwoodApolloProvider.js'
      mockWebRoutesPath = 'src/auth/__tests__/fixtures/RoutesWithUseAuth.tsx'

      addConfigToApp()
      addConfigToRoutes()
    })
  })

  describe('Customized App.js', () => {
    it('Should add auth config when using explicit return', () => {
      mockWebAppPath = 'src/auth/__tests__/fixtures/AppWithExplicitReturn.js'

      addConfigToApp()
    })
  })

  describe('Swapped out GraphQL client', () => {
    let consoleWarn

    beforeAll(() => {
      consoleWarn = console.warn
      console.warn = jest.fn()
    })

    afterAll(() => {
      console.warn = consoleWarn
    })

    it('Should add auth config when app is missing RedwoodApolloProvider', () => {
      mockWebAppPath =
        'src/auth/__tests__/fixtures/AppWithoutRedwoodApolloProvider.js'

      addConfigToApp()

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/GraphQL.*useAuth/)
      )
    })
  })

  describe('addApiConfig', () => {
    it('Adds authDecoder arg to default graphql.ts file', () => {
      addApiConfig("import { authDecoder } from 'test-auth-api'")
    })

    it("Doesn't add authDecoder arg if one already exists", () => {
      mockApiGraphqlPath =
        'src/auth/__tests__/fixtures/app/api/src/functions/graphql.ts'
      addApiConfig("import { authDecoder } from 'test-auth-api'")
    })

    it("Doesn't add authDecoder arg if one already exists, even with a non-standard import name and arg placement", () => {
      mockApiGraphqlPath =
        'src/auth/__tests__/fixtures/app/api/src/functions/graphqlNonStandardAuthDecoder.ts'
      addApiConfig("import { authDecoder } from 'test-auth-api'")
    })
  })
})
