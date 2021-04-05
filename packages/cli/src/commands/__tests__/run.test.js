jest.mock('execa', () => jest.fn((cmd, params) => ({ cmd, params })))

jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    runCommandTask: jest.fn((commands) => {
      return commands.map(({ cmd, args }) => `${cmd} ${args?.join(' ')}`)
    }),
    getPaths: () => ({
      base: './',
      api: {
        dbSchema: '../../__fixtures__/example-todo-main/api/prisma',
      },
      web: {},
    }),
  }
})

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    existsSync: () => true,
  }
})

import execa from 'execa'

import { handler } from '../run'

afterEach(() => {
  jest.clearAllMocks()
})

test('Should run the correct command for run api', async () => {
  await handler({
    side: 'api',
  })
  expect(execa.mock.results[0].value).toEqual({
    cmd: 'yarn api-server',
    params: ['--functions', './dist/functions'],
  })
})
