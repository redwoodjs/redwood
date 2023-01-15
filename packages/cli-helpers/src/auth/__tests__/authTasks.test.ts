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
  addConfigToWebApp,
  addConfigToRoutes,
  createWebAuth,
  AuthGeneratorCtx,
  hasAuthProvider,
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
    const basedir = path.join(__dirname, 'fixtures/dbAuthSetup')
    const ctx: AuthGeneratorCtx = {
      provider: 'auth0',
      setupMode: 'FORCE',
    }

    addConfigToWebApp().task(ctx, {} as any)
    createWebAuth(basedir, false).task(ctx)
    addConfigToRoutes().task()
  })

  it('Should update App.{js,tsx}, Routes.{js,tsx} and add auth.ts (Clerk)', () => {
    const basedir = path.join(__dirname, 'fixtures/dbAuthSetup')
    const ctx: AuthGeneratorCtx = {
      provider: 'clerk',
      setupMode: 'FORCE',
    }

    addConfigToWebApp().task(ctx, {} as any)
    createWebAuth(basedir, false).task(ctx)
    addConfigToRoutes().task()
  })

  it('Should update App.tsx for legacy apps', () => {
    const ctx: AuthGeneratorCtx = {
      provider: 'clerk',
      setupMode: 'FORCE',
    }

    mockWebAppPath = 'src/auth/__tests__/fixtures/AppWithLegacyAuth.tsx'

    addConfigToWebApp().task(ctx, {} as any)
  })

  describe('Components with props', () => {
    it('Should add useAuth on the same line for single line components, and separate line for multiline components', () => {
      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      mockWebAppPath =
        'src/auth/__tests__/fixtures/AppWithCustomRedwoodApolloProvider.js'
      mockWebRoutesPath =
        'src/auth/__tests__/fixtures/RoutesWithCustomRouterProps.tsx'

      addConfigToWebApp().task(ctx, {} as any)
      addConfigToRoutes().task()
    })

    it('Should not add useAuth if one already exists', () => {
      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      mockWebAppPath =
        'src/auth/__tests__/fixtures/AppWithCustomRedwoodApolloProvider.js'
      mockWebRoutesPath = 'src/auth/__tests__/fixtures/RoutesWithUseAuth.tsx'

      addConfigToWebApp().task(ctx, {} as any)
      addConfigToRoutes().task()
    })
  })

  describe('Customized App.js', () => {
    it('Should add auth config when using explicit return', () => {
      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      mockWebAppPath = 'src/auth/__tests__/fixtures/AppWithExplicitReturn.js'

      addConfigToWebApp().task(ctx, {} as any)
    })
  })

  describe('Swapped out GraphQL client', () => {
    it('Should add auth config when app is missing RedwoodApolloProvider', () => {
      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      mockWebAppPath =
        'src/auth/__tests__/fixtures/AppWithoutRedwoodApolloProvider.js'

      const task = { output: '' } as any
      addConfigToWebApp().task(ctx, task)

      expect(task.output).toMatch(/GraphQL.*useAuth/)
    })
  })

  describe('addApiConfig', () => {
    it('Adds authDecoder arg to default graphql.ts file', () => {
      addApiConfig({
        replaceExistingImport: true,
        authDecoderImport: "import { authDecoder } from 'test-auth-api'",
      })
    })

    it("Doesn't add authDecoder arg if one already exists", () => {
      mockApiGraphqlPath =
        'src/auth/__tests__/fixtures/app/api/src/functions/graphql.ts'
      addApiConfig({
        replaceExistingImport: true,
        authDecoderImport: "import { authDecoder } from 'test-auth-api'",
      })
    })

    it("Doesn't add authDecoder arg if one already exists, even with a non-standard import name and arg placement", () => {
      mockApiGraphqlPath =
        'src/auth/__tests__/fixtures/app/api/src/functions/graphqlNonStandardAuthDecoder.ts'
      addApiConfig({
        replaceExistingImport: true,
        authDecoderImport: "import { authDecoder } from 'test-auth-api'",
      })
    })
  })

  describe('hasAuthProvider', () => {
    test('Legacy auth single line', () => {
      const content = `
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <AuthProvider client={netlifyIdentity} type="netlify">
                <RedwoodApolloProvider>
                  <Routes />
                </RedwoodApolloProvider>
              </AuthProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `

      expect(hasAuthProvider(content)).toBeTruthy()
    })

    test('Legacy auth multi-line', () => {
      const content = `
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <AuthProvider
                client={WebAuthnClient}
                type="dbAuth"
                config={{ fetchConfig: { credentials: 'include' } }}
              >
                <RedwoodApolloProvider
                  graphQLClientConfig={{
                    httpLinkConfig: { credentials: 'include' },
                  }}
                >
                  <Routes />
                </RedwoodApolloProvider>
              </AuthProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `

      expect(hasAuthProvider(content)).toBeTruthy()
    })

    test('AuthProvider exists', () => {
      const content = `
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <AuthProvider>
                <RedwoodApolloProvider useAuth={useAuth}>
                  <Routes />
                </RedwoodApolloProvider>
              </AuthProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `

      expect(hasAuthProvider(content)).toBeTruthy()
    })

    test("AuthProvider doesn't exist", () => {
      const content = `
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <RedwoodApolloProvider>
                <Routes />
              </RedwoodApolloProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `

      expect(hasAuthProvider(content)).toBeFalsy()
    })
  })
})
