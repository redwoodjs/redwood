import { vol } from 'memfs'

import { getPaths } from '@redwoodjs/project-config'

import { handler, NO_PENDING_MIGRATIONS_MESSAGE } from '../commands/upHandler'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const redwoodProjectPath = '/redwood-app'

let consoleLogMock: jest.SpyInstance
let consoleInfoMock: jest.SpyInstance
let consoleErrorMock: jest.SpyInstance
let consoleWarnMock: jest.SpyInstance

beforeEach(() => {
  consoleLogMock = jest.spyOn(console, 'log').mockImplementation()
  consoleInfoMock = jest.spyOn(console, 'info').mockImplementation()
  consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()
  consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
})

afterEach(() => {
  consoleLogMock.mockRestore()
  consoleInfoMock.mockRestore()
  consoleErrorMock.mockRestore()
  consoleWarnMock.mockRestore()
})

jest.mock('fs', () => require('memfs').fs)

const mockDataMigrations: { current: any[] } = { current: [] }

jest.mock(
  '/redwood-app/api/dist/lib/db.js',
  () => {
    return {
      db: {
        rW_DataMigration: {
          create(dataMigration) {
            mockDataMigrations.current.push(dataMigration)
          },
          findMany() {
            return mockDataMigrations.current
          },
        },
        $disconnect: () => {},
      },
    }
  },
  { virtual: true }
)

jest.mock(
  `\\redwood-app\\api\\dist\\lib\\db.js`,
  () => {
    return {
      db: {
        rW_DataMigration: {
          create(dataMigration) {
            mockDataMigrations.current.push(dataMigration)
          },
          findMany() {
            return mockDataMigrations.current
          },
        },
        $disconnect: () => {},
      },
    }
  },
  { virtual: true }
)

jest.mock(
  '/redwood-app/api/db/dataMigrations/20230822075442-wip.ts',
  () => {
    return { default: () => {} }
  },
  {
    virtual: true,
  }
)

jest.mock(
  '\\redwood-app\\api\\db\\dataMigrations\\20230822075442-wip.ts',
  () => {
    return { default: () => {} }
  },
  {
    virtual: true,
  }
)

jest.mock(
  '/redwood-app/api/db/dataMigrations/20230822075443-wip.ts',
  () => {
    return {
      default: () => {
        throw new Error('oops')
      },
    }
  },
  {
    virtual: true,
  }
)

jest.mock(
  '\\redwood-app\\api\\db\\dataMigrations\\20230822075443-wip.ts',
  () => {
    return {
      default: () => {
        throw new Error('oops')
      },
    }
  },
  {
    virtual: true,
  }
)

jest.mock(
  '/redwood-app/api/db/dataMigrations/20230822075444-wip.ts',
  () => {
    return { default: () => {} }
  },
  {
    virtual: true,
  }
)

jest.mock(
  '\\redwood-app\\api\\db\\dataMigrations\\20230822075444-wip.ts',
  () => {
    return { default: () => {} }
  },
  {
    virtual: true,
  }
)

const RWJS_CWD = process.env.RWJS_CWD

beforeAll(() => {
  process.env.RWJS_CWD = redwoodProjectPath
})

afterEach(() => {
  vol.reset()
  mockDataMigrations.current = []
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

const ranDataMigration = {
  version: '20230822075441',
  name: '20230822075441-wip.ts',
  startedAt: '2023-08-22T07:55:16.292Z',
  finishedAt: '2023-08-22T07:55:16.292Z',
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('upHandler', () => {
  it("noops if there's no data migrations directory", async () => {
    vol.fromNestedJSON(
      {
        'redwood.toml': '',
        api: {
          dist: {
            lib: {
              'db.js': '',
            },
          },
          db: {
            // No dataMigrations dir:
            //
            // dataMigrations: {
            //   [ranDataMigration.name]: '',
            // },
          },
        },
      },
      redwoodProjectPath
    )

    await handler({
      importDbClientFromDist: true,
      distPath: getPaths().api.dist,
    })

    expect(consoleInfoMock.mock.calls[0][0]).toMatch(
      NO_PENDING_MIGRATIONS_MESSAGE
    )
  })

  it("noops if there's no pending migrations", async () => {
    mockDataMigrations.current = [ranDataMigration]

    vol.fromNestedJSON(
      {
        'redwood.toml': '',
        api: {
          dist: {
            lib: {
              'db.js': '',
            },
          },
          db: {
            dataMigrations: {
              [ranDataMigration.name]: '',
            },
          },
        },
      },
      redwoodProjectPath
    )

    await handler({
      importDbClientFromDist: true,
      distPath: getPaths().api.dist,
    })

    expect(consoleInfoMock.mock.calls[0][0]).toMatch(
      NO_PENDING_MIGRATIONS_MESSAGE
    )
  })

  it('runs pending migrations', async () => {
    mockDataMigrations.current = [
      {
        version: '20230822075441',
        name: '20230822075441-wip.ts',
        startedAt: '2023-08-22T07:55:16.292Z',
        finishedAt: '2023-08-22T07:55:16.292Z',
      },
    ]

    vol.fromNestedJSON(
      {
        'redwood.toml': '',
        api: {
          dist: {
            lib: {
              'db.js': '',
            },
          },
          db: {
            dataMigrations: {
              '20230822075442-wip.ts': '',
              '20230822075443-wip.ts': '',
              '20230822075444-wip.ts': '',
            },
          },
        },
      },
      redwoodProjectPath
    )

    await handler({
      importDbClientFromDist: true,
      distPath: getPaths().api.dist,
    })

    // The handler will error and set the exit code to 1, we must revert that
    // or test suite itself will fail.
    process.exitCode = 0

    expect(consoleInfoMock.mock.calls[0][0]).toMatch(
      '1 data migration(s) completed successfully.'
    )
    expect(consoleErrorMock.mock.calls[1][0]).toMatch(
      '1 data migration(s) exited with errors.'
    )
    expect(consoleWarnMock.mock.calls[0][0]).toMatch(
      '1 data migration(s) skipped due to previous error'
    )
  })
})
