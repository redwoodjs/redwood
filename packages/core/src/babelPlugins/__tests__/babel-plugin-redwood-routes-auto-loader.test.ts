import path from 'path'

import pluginTester from 'babel-plugin-tester'

import { getProject } from '@redwoodjs/structure'

import plugin from '../babel-plugin-redwood-routes-auto-loader'

const mockReaddirSync = jest.fn(() => ['routes.d.ts'])
const mockWriteFileSync = jest.fn()

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

jest.mock('@redwoodjs/internal', () => ({
  getPaths: () => {
    return {
      web: {
        base: '/path/to/example/web',
        pages: '/path/to/example/web/src/pages',
      },
    }
  },
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
}))

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
