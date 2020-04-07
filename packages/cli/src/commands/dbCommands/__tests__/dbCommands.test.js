import * as lib from 'src/lib'

import * as up from '../up'
import * as down from '../down'
import * as save from '../save'
import * as generate from '../generate'
import * as seed from '../seed'

describe('db commands', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })

  beforeAll(() => {
    lib.runCommandTask = jest.fn((commands) => {
      return commands.map(({ cmd, args }) => `${cmd} ${args.join(' ')}`)
    })
  })

  it('some commands have a verbose flag', () => {
    expect(up.builder.verbose).toBeDefined()
    expect(down.builder.verbose).toBeDefined()
    expect(generate.builder.verbose).toBeDefined()
  })

  it('runs the command as expected', async () => {
    const { runCommandTask } = lib

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

    await seed.handler({})
    expect(runCommandTask.mock.results[5].value).toEqual(['node seeds.js'])
  })
})
