jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getPaths: () => {
      return {
        api: {
          dbSchema:
            '/Users/bazinga/My Projects/rwprj/rwprj/api/db/schema.prisma',
        },
        base: '/Users/bazinga/My Projects/rwprj/rwprj',
      }
    },
  }
})

jest.mock('execa', () => ({
  sync: jest.fn((cmd, params, options) => {
    return {
      cmd,
      params,
      options,
    }
  }),
}))

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    existsSync: () => true,
  }
})

import execa from 'execa'

import { handler } from '../prisma'

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  console.info.mockRestore()
  console.log.mockRestore()
})

test('the prisma command handles spaces', async () => {
  await handler({
    _: ['prisma'],
    $0: 'rw',
    commands: ['migrate', 'dev'],
    // options
    n: 'add bazingas',
  })

  expect(execa.sync.mock.calls[0][1]).toEqual([
    'migrate',
    'dev',
    '-n',
    '"add bazingas"',
    '--schema',
    '"/Users/bazinga/My Projects/rwprj/rwprj/api/db/schema.prisma"',
  ])
})
