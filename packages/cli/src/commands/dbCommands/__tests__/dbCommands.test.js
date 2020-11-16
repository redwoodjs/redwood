import { runCommandTask } from 'src/lib'

import * as up from '../up'
import * as down from '../down'
import * as save from '../save'
import * as generate from '../generate'
import * as seed from '../seed'
import * as introspect from '../introspect'

const schema = './api/db/schema.prisma'

jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    runCommandTask: jest.fn((commands) => {
      return commands.map(({ cmd, args }) => `${cmd} ${args?.join(' ')}`)
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
    expect(up.builder.toString()).toMatch('verbose')
    expect(down.builder.toString()).toMatch('verbose')
    expect(generate.builder.toString()).toMatch('verbose')
    expect(introspect.builder.toString()).toMatch('verbose')
  })

  it('runs the command as expected', async () => {
    await up.handler({ dbClient: true, schema })
    expect(runCommandTask.mock.results[0].value).toEqual([
      `yarn prisma migrate up --experimental --create-db --schema=${schema}`,
    ])

    await up.handler({ dbClient: true, autoApprove: true, schema })
    expect(runCommandTask.mock.results[1].value).toEqual([
      `yarn prisma migrate up --experimental --create-db --auto-approve --schema=${schema}`,
    ])

    await down.handler({ schema })
    expect(runCommandTask.mock.results[2].value).toEqual([
      `yarn prisma migrate down --experimental --schema=${schema}`,
    ])

    await save.handler({ name: 'my-migration', schema })
    expect(runCommandTask.mock.results[3].value).toEqual([
      `yarn prisma migrate save --name "my-migration" --create-db --experimental --schema=${schema}`,
    ])

    await introspect.handler({ schema })
    expect(runCommandTask.mock.results[4].value).toEqual([
      `yarn prisma introspect --schema=${schema}`,
    ])

    await seed.handler({})
    expect(runCommandTask.mock.results[5].value).toEqual(['node seeds.js'])
  })
})
