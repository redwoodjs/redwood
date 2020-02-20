jest.mock('@redwoodjs/internal')
jest.mock('src/lib')

import { runCommandTask } from 'src/lib'

import * as up from '../up'
import * as down from '../down'
import * as save from '../save'
import * as generate from '../generate'
import * as seed from '../seed'

describe('db commands', () => {
  it('some commands have a verbose flag', () => {
    expect(up.builder.verbose).toBeDefined()
    expect(down.builder.verbose).toBeDefined()
    expect(generate.builder.verbose).toBeDefined()
  })

  it('runs the command as expected', async () => {
    await up.handler({})
    expect(runCommandTask.mock.results[0].value).toEqual([
      'yarn prisma2 migrate up --experimental',
      'yarn prisma2 generate',
    ])

    await down.handler({})
    expect(runCommandTask.mock.results[1].value).toEqual([
      'yarn prisma2 migrate down --experimental',
    ])

    await save.handler({ name: 'my-migration' })
    expect(runCommandTask.mock.results[2].value).toEqual([
      'yarn prisma2 migrate save --name my-migration --experimental',
    ])

    await generate.handler({})
    expect(runCommandTask.mock.results[3].value).toEqual([
      'yarn prisma2 generate',
    ])

    await seed.handler({})
    expect(runCommandTask.mock.results[4].value).toEqual(['node seeds.js'])
  })
})
