jest.mock('execa', () =>
  jest.fn((cmd, params, options) => {
    return {
      cmd,
      params,
      options,
    }
  })
)

jest.mock('concurrently', () =>
  jest.fn((commands, options) => {
    return {
      commands,
      options,
    }
  })
)

import '../../lib/mockTelemetry'

let mockedRedwoodConfig = {
  api: {},
  web: {},
  browser: {},
}

jest.mock('../../lib', () => {
  return {
    ...jest.requireActual('../../lib'),
    runCommandTask: jest.fn((commands) => {
      return commands.map(({ cmd, args }) => `${cmd} ${args?.join(' ')}`)
    }),
    getPaths: () => ({
      base: './myBasePath',
      api: {
        dbSchema: '../../__fixtures__/example-todo-main/api/prisma',
      },
      web: {},
    }),
    getConfig: () => {
      return mockedRedwoodConfig
    },
  }
})

jest.mock('../../commands/upgrade', () => {
  return {
    getCmdMajorVersion: () => 3,
  }
})

import path from 'path'

import concurrently from 'concurrently'
import execa from 'execa'

import { runCommandTask } from '../../lib'
import { handler } from '../type-check'

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  jest.clearAllMocks()
  console.info.mockRestore()
  console.log.mockRestore()
})

test('Should run tsc commands correctly, in order', async () => {
  await handler({
    sides: ['web', 'api'],
    prisma: false,
    generate: true,
  })

  const concurrentlyArgs = concurrently.mock.results[0].value

  expect(execa.mock.results[0].value.cmd).toEqual('yarn rw-gen')

  // Ensure tsc command run correctly for web side
  expect(concurrentlyArgs.commands).toContainEqual({
    cwd: path.join('myBasePath', 'web'),
    command: 'yarn  tsc --noEmit --skipLibCheck',
  })
  // Ensure tsc command run correctly for web side
  expect(concurrentlyArgs.commands).toContainEqual({
    cwd: path.join('myBasePath', 'api'),
    command: 'yarn  tsc --noEmit --skipLibCheck',
  })
  // Ensure we have raw sequential output from tsc
  expect(concurrentlyArgs.options).toEqual({ group: true, raw: true })
})

test('Should generate prisma client', async () => {
  await handler({
    sides: ['api'],
    prisma: true,
    generate: true,
  })

  const concurrentlyArgs = concurrently.mock.results[0].value

  expect(execa.mock.results[0].value.cmd).toEqual('yarn rw-gen')

  // Ensure tsc command run correctly for web side
  expect(concurrentlyArgs.commands).toContainEqual({
    cwd: path.join('myBasePath', 'api'),
    command: 'yarn  tsc --noEmit --skipLibCheck',
  })
  expect(runCommandTask.mock.results[0].value[0]).toMatch(
    /.+(\\|\/)prisma(\\|\/)build(\\|\/)index.js.+/
  )
})
