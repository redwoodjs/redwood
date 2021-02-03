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

describe('router auto loader pre-rendering', () => {
  const project = getProject(pathToFixturesApp)

  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-routes-auto-loader',
    pluginOptions: {
      project,
      useStaticImports: true,
    },
    fixtures: path.join(
      __dirname,
      '__fixtures__/routes-auto-loader-static-imports'
    ),
  })
})

describe('routes auto loader', () => {
  const project = getProject(pathToFixturesApp)

  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-routes-auto-loader',
    pluginOptions: {
      project,
    },
    fixtures: path.join(__dirname, '__fixtures__/routes-auto-loader/dynamic'),
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

describe('routes auto loader useStaticImports', () => {
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
      useStaticImports: true,
    },
    fixtures: path.join(__dirname, '__fixtures__/routes-auto-loader/static'),
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
