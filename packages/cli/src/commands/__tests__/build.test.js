jest.mock('execa', () => jest.fn((cmd) => cmd))

let mockedRedwoodConfig = {
  api: {},
  web: {},
  browser: {},
}
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
    getConfig: () => {
      return mockedRedwoodConfig
    },
  }
})

import execa from 'execa'

import { runCommandTask } from 'src/lib'

import { handler } from '../build'

afterEach(() => {
  jest.clearAllMocks()
})

test('Should clean api and web dist directories, before build', async () => {
  await handler({})
  expect(execa.mock.results[0].value).toEqual(`rimraf dist/*`)
})

test('The build command runs the correct commands.', async () => {
  await handler({})
  expect(runCommandTask.mock.results[0].value[0]).toEqual(
    'yarn prisma generate --schema="../../__fixtures__/example-todo-main/api/prisma"'
  )

  expect(execa.mock.results[1].value).toEqual(
    `yarn cross-env NODE_ENV=production babel src --out-dir dist --delete-dir-on-start --extensions .ts,.js --ignore '**/*.test.ts,**/*.test.js,**/__tests__'`
  )

  expect(execa.mock.results[2].value).toEqual(
    `yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.production.js`
  )
})

test('Should run prerender for web, when experimental flag is on', async () => {
  mockedRedwoodConfig = {
    web: {
      experimentalPrerender: true,
    },
  }
  await handler({ side: ['web'] })
  expect(execa.mock.results[1].value).toEqual(
    'yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.production.js'
  )

  expect(execa.mock.results[2].value).toEqual('yarn rw prerender')
})
