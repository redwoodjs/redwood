// Have to use `var` here to avoid "Temporal Dead Zone" issues
// eslint-disable-next-line
var mockIsTypeScriptProject = true

jest.mock('../../lib/project', () => ({
  isTypeScriptProject: () => mockIsTypeScriptProject,
}))

jest.mock('../../lib', () => ({
  transformTSToJS: (_path: string, data: string) => data,
}))

// mock Telemetry for CLI commands so they don't try to spawn a process
jest.mock('@redwoodjs/telemetry', () => {
  return {
    errorTelemetry: () => jest.fn(),
    timedTelemetry: () => jest.fn(),
  }
})

jest.mock('../../lib/paths', () => {
  const path = require('path')
  const actualPaths = jest.requireActual('../../lib/paths')
  const basedir = '/mock/setup/path'
  const app = mockIsTypeScriptProject ? 'App.tsx' : 'App.js'
  const routes = mockIsTypeScriptProject ? 'Routes.tsx' : 'Routes.js'

  return {
    resolveFile: actualPaths.resolveFile,
    getPaths: () => ({
      api: {
        functions: '',
        src: '',
        lib: '',
        graphql: path.join(basedir, 'api/src/functions/graphql.ts'),
      },
      web: {
        src: path.join(basedir, 'web/src'),
        app: path.join(basedir, `web/src/${app}`),
        routes: path.join(basedir, `web/src/${routes}`),
      },
      base: path.join(basedir),
    }),
  }
})

jest.mock('../../lib/project', () => {
  return {
    isTypeScriptProject: () => mockIsTypeScriptProject,
    getGraphqlPath: () => {
      const { getPaths } = require('../../lib/paths')
      return getPaths().api.graphql
    },
  }
})

// This will load packages/cli-helpers/__mocks__/fs.js
jest.mock('fs')

const mockFS = fs as unknown as Omit<jest.Mocked<typeof fs>, 'readdirSync'> & {
  __setMockFiles: (files: Record<string, string>) => void
  __getMockFiles: () => Record<string, string>
  readdirSync: () => string[]
}

import fs from 'fs'
import path from 'path'

import { getPaths } from '../../lib/paths'
import {
  addApiConfig,
  addConfigToWebApp,
  addConfigToRoutes,
  createWebAuth,
  AuthGeneratorCtx,
  hasAuthProvider,
  removeAuthProvider,
} from '../authTasks'

import {
  auth0WebAuthTsTemplate,
  clerkWebAuthTsTemplate,
  customApolloAppTsx,
  customPropsRoutesTsx,
  explicitReturnAppTsx,
  graphqlTs,
  legacyAuthWebAppTsx,
  nonStandardAuthDecoderGraphqlTs,
  routesTsx,
  useAuthRoutesTsx,
  webAppTsx,
  withAuthDecoderGraphqlTs,
  withoutRedwoodApolloAppTsx,
} from './mockFsFiles'

function platformPath(filePath: string) {
  return filePath.split('/').join(path.sep)
}

beforeEach(() => {
  mockIsTypeScriptProject = true
  jest.restoreAllMocks()

  mockFS.__setMockFiles({
    [path.join(
      getPaths().base,
      platformPath('/templates/web/auth.ts.template')
    )]: '// web auth template',
    [getPaths().web.app]: webAppTsx,
    [getPaths().api.graphql]: graphqlTs,
    [getPaths().web.routes]: routesTsx,
  })

  mockFS.readdirSync = () => {
    return ['auth.ts.template']
  }
})

describe('authTasks', () => {
  it('Should update App.{js,tsx}, Routes.{js,tsx} and add auth.ts (Auth0)', () => {
    const templatePath = path.join(
      getPaths().base,
      platformPath('/templates/web/auth.ts.template')
    )

    mockFS.__setMockFiles({
      ...mockFS.__getMockFiles(),
      [templatePath]: auth0WebAuthTsTemplate,
    })

    const ctx: AuthGeneratorCtx = {
      provider: 'auth0',
      setupMode: 'FORCE',
    }

    addConfigToWebApp().task(ctx, {} as any)
    createWebAuth(getPaths().base, false).task(ctx)
    addConfigToRoutes().task()

    const authTsPath = path.join(getPaths().web.src, 'auth.ts')

    expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
    expect(fs.readFileSync(authTsPath)).toMatchSnapshot()
    expect(fs.readFileSync(getPaths().web.routes)).toMatchSnapshot()
  })

  it('Should update App.{js,tsx}, Routes.{js,tsx} and add auth.ts (Clerk)', () => {
    const templatePath = path.join(
      getPaths().base,
      platformPath('/templates/web/auth.tsx.template')
    )

    mockFS.__setMockFiles({
      ...mockFS.__getMockFiles(),
      [templatePath]: clerkWebAuthTsTemplate,
    })
    mockFS.readdirSync = () => {
      return ['auth.tsx.template']
    }

    const ctx: AuthGeneratorCtx = {
      provider: 'clerk',
      setupMode: 'FORCE',
    }

    addConfigToWebApp().task(ctx, {} as any)
    createWebAuth(getPaths().base, false).task(ctx)
    addConfigToRoutes().task()

    const authTsPath = path.join(getPaths().web.src, 'auth.tsx')

    expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
    expect(fs.readFileSync(authTsPath)).toMatchSnapshot()
    expect(fs.readFileSync(getPaths().web.routes)).toMatchSnapshot()
  })

  it('Should update App.tsx for legacy apps', () => {
    mockFS.__setMockFiles({
      ...mockFS.__getMockFiles(),
      [getPaths().web.app]: legacyAuthWebAppTsx,
    })

    const ctx: AuthGeneratorCtx = {
      provider: 'clerk',
      setupMode: 'FORCE',
    }

    addConfigToWebApp().task(ctx, {} as any)

    expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
  })

  describe('Components with props', () => {
    it('Should add useAuth on the same line for single line components, and separate line for multiline components', () => {
      mockFS.__setMockFiles({
        ...mockFS.__getMockFiles(),
        [getPaths().web.app]: customApolloAppTsx,
        [getPaths().web.routes]: customPropsRoutesTsx,
      })

      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      addConfigToWebApp().task(ctx, {} as any)
      addConfigToRoutes().task()

      expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
      expect(fs.readFileSync(getPaths().web.routes)).toMatchSnapshot()
    })

    it('Should not add useAuth if one already exists', () => {
      mockFS.__setMockFiles({
        ...mockFS.__getMockFiles(),
        [getPaths().web.app]: customApolloAppTsx,
        [getPaths().web.routes]: useAuthRoutesTsx,
      })

      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      addConfigToWebApp().task(ctx, {} as any)
      addConfigToRoutes().task()

      expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
      expect(fs.readFileSync(getPaths().web.routes)).toMatchSnapshot()
    })
  })

  describe('Customized App.js', () => {
    it('Should add auth config when using explicit return', () => {
      mockFS.__setMockFiles({
        ...mockFS.__getMockFiles(),
        [getPaths().web.app]: explicitReturnAppTsx,
      })

      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      addConfigToWebApp().task(ctx, {} as any)

      expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
    })
  })

  describe('Swapped out GraphQL client', () => {
    it('Should add auth config when app is missing RedwoodApolloProvider', () => {
      mockFS.__setMockFiles({
        ...mockFS.__getMockFiles(),
        [getPaths().web.app]: withoutRedwoodApolloAppTsx,
      })

      const ctx: AuthGeneratorCtx = {
        provider: 'clerk',
        setupMode: 'FORCE',
      }

      const task = { output: '' } as any
      addConfigToWebApp().task(ctx, task)

      expect(task.output).toMatch(/GraphQL.*useAuth/)
      expect(fs.readFileSync(getPaths().web.app)).toMatchSnapshot()
    })
  })

  describe('addApiConfig', () => {
    it('Adds authDecoder arg to default graphql.ts file', () => {
      addApiConfig({
        replaceExistingImport: true,
        authDecoderImport: "import { authDecoder } from 'test-auth-api'",
      })

      expect(fs.readFileSync(getPaths().api.graphql)).toMatchSnapshot()
    })

    it("Doesn't add authDecoder arg if one already exists", () => {
      mockFS.__setMockFiles({
        ...mockFS.__getMockFiles(),
        [getPaths().api.graphql]: withAuthDecoderGraphqlTs,
      })

      addApiConfig({
        replaceExistingImport: true,
        authDecoderImport: "import { authDecoder } from 'test-auth-api'",
      })

      expect(fs.readFileSync(getPaths().api.graphql)).toMatchSnapshot()
    })

    it("Doesn't add authDecoder arg if one already exists, even with a non-standard import name and arg placement", () => {
      mockFS.__setMockFiles({
        ...mockFS.__getMockFiles(),
        [getPaths().api.graphql]: nonStandardAuthDecoderGraphqlTs,
      })

      addApiConfig({
        replaceExistingImport: true,
        authDecoderImport: "import { authDecoder } from 'test-auth-api'",
      })

      expect(fs.readFileSync(getPaths().api.graphql)).toMatchSnapshot()
    })
  })

  describe('hasAuthProvider', () => {
    test('Single line', () => {
      expect(hasAuthProvider('<AuthProvider')).toBeTruthy()
      expect(hasAuthProvider('<AuthProvider>')).toBeTruthy()
      expect(
        hasAuthProvider(
          '<AuthProvider client={netlifyIdentity} type="netlify">'
        )
      ).toBeTruthy()
      expect(hasAuthProvider('<AuthProviderFoo')).toBeFalsy()
      expect(hasAuthProvider('</AuthProvider>')).toBeFalsy()
      expect(hasAuthProvider('<FooAuthProvider')).toBeFalsy()
      expect(hasAuthProvider('<FooAuthProvider>')).toBeFalsy()
    })

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

  describe('removeAuthProvider', () => {
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

      expect(removeAuthProvider(content)).toMatch(`
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <RedwoodApolloProvider>
                <Routes />
              </RedwoodApolloProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `)
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

      expect(removeAuthProvider(content)).toMatch(`
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <RedwoodApolloProvider
                graphQLClientConfig={{
                  httpLinkConfig: { credentials: 'include' },
                }}
              >
                <Routes />
              </RedwoodApolloProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `)
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

      expect(removeAuthProvider(content)).toMatch(`
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <RedwoodApolloProvider useAuth={useAuth}>
                <Routes />
              </RedwoodApolloProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `)
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

      expect(removeAuthProvider(content)).toMatch(`
        const App = () => (
          <FatalErrorBoundary page={FatalErrorPage}>
            <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
              <RedwoodApolloProvider>
                <Routes />
              </RedwoodApolloProvider>
            </RedwoodProvider>
          </FatalErrorBoundary>
        )
      `)
    })
  })

  it('writes an auth.ts file for TS projects', () => {
    const ctx: AuthGeneratorCtx = {
      provider: 'auth0',
      setupMode: 'FORCE',
    }
    createWebAuth(getPaths().base, false).task(ctx)

    expect(
      fs.readFileSync(path.join(getPaths().web.src, 'auth.ts'))
    ).toMatchSnapshot()
  })

  it('writes an auth.js file for JS projects', () => {
    mockIsTypeScriptProject = false

    mockFS.__setMockFiles({
      ...mockFS.__getMockFiles(),
      [getPaths().web.app]: webAppTsx,
    })

    const ctx: AuthGeneratorCtx = {
      provider: 'auth0',
      setupMode: 'FORCE',
    }
    createWebAuth(getPaths().base, false).task(ctx)

    expect(
      fs.readFileSync(path.join(getPaths().web.src, 'auth.js'))
    ).toMatchSnapshot()
  })
})
