// Have to use `var` here to avoid "Temporal Dead Zone" issues
var mockWebAppPath = ''
var mockWebRoutesPath = ''

import fs from 'fs'

import '../../../../lib/mockTelemetry'

import {
  addConfigToApp,
  addConfigToRoutes,
  createWebAuthTs,
} from '../authTasks'

jest.mock('../../../../lib', () => {
  const path = require('path')
  const __dirname = path.resolve()
  const originalModule = jest.requireActual('../../../../lib')

  return {
    transformTSToJS: originalModule.transformTSToJS,
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

jest.mock('@redwoodjs/internal/dist/paths', () => {
  const path = require('path')
  const __dirname = path.resolve()
  const originalModule = jest.requireActual('@redwoodjs/internal/dist/paths')

  return {
    transformTSToJS: originalModule.transformTSToJS,
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
          '../create-redwood-app/template/web/src/Routes.tsx'
        ),
      },
      base: path.join(__dirname, '../create-redwood-app/template'),
    }),
  }
})

jest.mock('../../../../lib/project', () => ({
  isTypeScriptProject: () => false,
}))

// This function checks output matches
const writeFileSyncSpy = jest.fn((_, content) => {
  // Line breaks cause an issue on windows snapshots
  expect(content).toMatchSnapshot()
})

beforeEach(() => {
  mockWebAppPath = ''
  jest.restoreAllMocks()
  jest.spyOn(fs, 'writeFileSync').mockImplementation(writeFileSyncSpy)
})

describe('Should update App.{js,tsx}, Routes.{js,tsx} and add auth.ts', () => {
  it('Matches Auth0 Snapshot', () => {
    addConfigToApp()
    createWebAuthTs('auth0')
    addConfigToRoutes()
  })

  it('Matches Clerk Snapshot', () => {
    addConfigToApp()
    createWebAuthTs('clerk')
    addConfigToRoutes()
  })
})

describe('Components with props', () => {
  it('Should add useAuth on the same line for single line components, and separate line for multiline components', () => {
    mockWebAppPath =
      'src/commands/setup/auth/__tests__/fixtures/AppWithCustomRedwoodApolloProvider.js'
    mockWebRoutesPath =
      'src/commands/setup/auth/__tests__/fixtures/RoutesWithCustomRouterProps.tsx'

    addConfigToApp()
    addConfigToRoutes()
  })

  it('Should not add useAuth if one already exists', () => {
    mockWebAppPath =
      'src/commands/setup/auth/__tests__/fixtures/AppWithCustomRedwoodApolloProvider.js'
    mockWebRoutesPath =
      'src/commands/setup/auth/__tests__/fixtures/RoutesWithUseAuth.tsx'

    addConfigToApp()
    addConfigToRoutes()
  })
})

describe('Customized App.js', () => {
  it('Should add auth config when using explicit return', () => {
    mockWebAppPath =
      'src/commands/setup/auth/__tests__/fixtures/AppWithExplicitReturn.js'

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
      'src/commands/setup/auth/__tests__/fixtures/AppWithoutRedwoodApolloProvider.js'

    addConfigToApp()

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/GraphQL.*useAuth/)
    )
  })
})
