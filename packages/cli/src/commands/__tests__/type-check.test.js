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

import path from 'path'

import concurrently from 'concurrently'
import execa from 'execa'

import { runCommandTask } from '../../lib'
import { handler } from '../type-check'

afterEach(() => {
  jest.clearAllMocks()
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
    command: 'yarn -s tsc --noEmit --skipLibCheck',
  })
  // Ensure tsc command run correctly for web side
  expect(concurrentlyArgs.commands).toContainEqual({
    cwd: path.join('myBasePath', 'api'),
    command: 'yarn -s tsc --noEmit --skipLibCheck',
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
    command: 'yarn -s tsc --noEmit --skipLibCheck',
  })
  expect(runCommandTask.mock.results[0].value[0]).toEqual(
    'yarn prisma generate --schema="../../__fixtures__/example-todo-main/api/prisma"'
  )
})
