import path from 'path'

import pluginTester from 'babel-plugin-tester'

import { getProject } from '@redwoodjs/structure'

import plugin from '../babel-plugin-redwood-routes-auto-loader'

const mockReaddirSync = jest.fn(() => ['routes.d.ts'])
const mockWriteFileSync = jest.fn()

const pathToFixturesApp = path.resolve(
  __dirname,
  '../../../../../__fixtures__/example-todo-main'
)
process.env.__REDWOOD__CONFIG_PATH = path.join(pathToFixturesApp)

jest.mock('@redwoodjs/structure', () => {
  return {
    ...jest.requireActual('@redwoodjs/structure'),
    DefaultHost: jest.fn().mockImplementation(() => ({
      readdirSync: mockReaddirSync,
      writeFileSync: mockWriteFileSync,
      paths: {
        types: '/fake/project/node_modules/@types/@redwoodjs/generated',
      },
    })),
  }
})

jest.mock('@redwoodjs/internal', () => {
  const pathRequired = require('path')
  // __dirname not available
  const __dirname = pathRequired.resolve()
  return {
    getPaths: jest.fn(() => {
      const MOCK_BASE_WEB_DIR = pathRequired.join(
        __dirname,
        '../../__fixtures__/example-todo-main',
        'web'
      )

      const MOCK_WEB_SRC = pathRequired.join(MOCK_BASE_WEB_DIR, 'src')
      const MOCK_WEB_SRC_APP = pathRequired.join(
        MOCK_BASE_WEB_DIR,
        'src',
        'App'
      )
      const MOCK_WEB_DIST = pathRequired.join(MOCK_BASE_WEB_DIR, 'dist')
      const MOCK_ROUTES = pathRequired.join(
        MOCK_BASE_WEB_DIR,
        'src',
        'Routes.js'
      )

      return {
        web: {
          base: MOCK_BASE_WEB_DIR,
          app: MOCK_WEB_SRC_APP,
          src: MOCK_WEB_SRC,
          dist: MOCK_WEB_DIST,
          routes: MOCK_ROUTES,
        },
      }
    }),
    processPagesDir: () => {
      return [
        {
          importName: 'APage',
          importPath: 'src/pages/APage',
          const: 'APage',
          path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/APage',
          importStatement:
            "const AboutPage = { name: 'APage', loader: () => import('src/pages/APage') }",
        },
        {
          importName: 'BPage',
          importPath: 'src/pages/BPage',
          const: 'BPage',
          path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/BPage',
          importStatement:
            "const AdminEditPostPage = { name: 'BPage', loader: () => import('src/pages/BPage') }",
        },

        {
          importName: 'NestedCPage',
          importPath: 'src/pages/Nested/NestedCPage',
          const: 'BPage',
          path: '/Users/peterp/x/redwoodjs/example-blog/web/src/pages/BPage',
          importStatement:
            "const AdminEditPostPage = { name: 'BPage', loader: () => import('src/pages/BPage') }",
        },
      ]
    },
  }
})

describe('routes auto loader', () => {
  const exampleTodoPath = path.resolve(
    __dirname,
    '../../../../../__fixtures__/example-todo-main'
  )
  const project = getProject(exampleTodoPath)

  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-routes-auto-loader',
    pluginOptions: {
      project,
    },
    fixtures: path.join(__dirname, '__fixtures__/routes-auto-loader'),
  })

  afterAll(() => {
    expect(mockWriteFileSync.mock.calls[0][0]).toContain(`routes.d.ts`)
    expect(mockWriteFileSync.mock.calls[0][1]).toContain(`home: () => "/"`)
    expect(mockWriteFileSync.mock.calls[1][0]).toContain(`index.d.ts`)
    expect(mockWriteFileSync.mock.calls[1][1]).toContain(
      `/// <reference path="./generated/routes.d.ts" />`
    )
    jest.clearAllMocks()
  })
})
