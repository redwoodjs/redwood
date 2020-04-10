import { runCommandTask } from 'src/lib'

import * as up from '../up'
import * as down from '../down'
import * as save from '../save'
import * as generate from '../generate'
import * as seed from '../seed'
import * as introspect from '../introspect'

jest.mock('src/lib', () => {
  return {
    ...require.requireActual('src/lib'),
    runCommandTask: jest.fn((commands) => {
      return commands.map(({ cmd, args }) => `${cmd} ${args.join(' ')}`)
    }),
    getPaths: () => ({
      api: {},
      web: {},
    }),
  }
})

describe('db commands', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('some commands have a verbose flag', () => {
    expect(up.builder.verbose).toBeDefined()
    expect(down.builder.verbose).toBeDefined()
    expect(generate.builder.verbose).toBeDefined()
    expect(introspect.builder.verbose).toBeDefined()
  })

  it('runs the command as expected', async () => {
    await up.handler({ dbClient: true })
    expect(runCommandTask.mock.results[0].value).toEqual([
      'yarn prisma migrate up --experimental --create-db',
    ])
    expect(runCommandTask.mock.results[1].value).toEqual([
      'yarn prisma generate',
    ])

    await down.handler({})
    expect(runCommandTask.mock.results[2].value).toEqual([
      'yarn prisma migrate down --experimental',
    ])

    await save.handler({ name: 'my-migration' })
    expect(runCommandTask.mock.results[3].value).toEqual([
      'yarn prisma migrate save --name my-migration --experimental',
    ])

    await generate.handler({})
    expect(runCommandTask.mock.results[4].value).toEqual([
      'yarn prisma generate',
    ])

    await introspect.handler({})
    expect(runCommandTask.mock.results[5].value).toEqual([
      'yarn prisma2 introspect',
    ])

    await seed.handler({})
    expect(runCommandTask.mock.results[6].value).toEqual(['node seeds.js'])
  })
})
