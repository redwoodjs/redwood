import { vol } from 'memfs'
import yargs from 'yargs/yargs'

import { getPaths } from '@redwoodjs/project-config'

import * as upCommand from '../commands/up'
import { handler as dataMigrateUpHandler } from '../commands/upHandler.js'

jest.mock('fs', () => require('memfs').fs)
jest.mock(
  '../commands/upHandler.js',
  () => ({
    handler: jest.fn(),
  }),
  { virtual: true }
)

describe('up', () => {
  it('exports `command`, `description`, `builder`, and `handler`', () => {
    expect(upCommand).toHaveProperty('command', 'up')
    expect(upCommand).toHaveProperty(
      'description',
      'Run any outstanding Data Migrations against the database'
    )
    expect(upCommand).toHaveProperty('builder')
    expect(upCommand).toHaveProperty('handler')
  })

  it('`builder` configures two options with defaults', () => {
    vol.fromNestedJSON(
      {
        'redwood.toml': '',
        api: {
          dist: {},
        },
      },
      '/redwood-app'
    )

    process.env.RWJS_CWD = '/redwood-app'

    const { argv } = upCommand.builder(yargs)

    expect(argv).toHaveProperty('import-db-client-from-dist', false)
    expect(argv).toHaveProperty('dist-path', getPaths().api.dist)
  })

  it('`handler` proxies to `./upHandler.js`', async () => {
    await upCommand.handler({})
    expect(dataMigrateUpHandler).toHaveBeenCalled()
  })
})
