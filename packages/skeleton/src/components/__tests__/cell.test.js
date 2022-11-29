import path from 'path'

import { getCells } from '../cell'
import { getProject } from '../project'

describe('From inside the test-project fixture', () => {
  const FIXTURE_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '__fixtures__',
    'test-project'
  )

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  it('returns the correct cells without a project', () => {
    const cells = getCells()
    cells.forEach((cell) => {
      // Remove the leading section of the path because it'll be dependant on the host machine
      cell.path = cell.path.substring(FIXTURE_PATH.length)
    })
    expect(cells).toMatchSnapshot()
  })

  it('returns the correct cells with a project', () => {
    const project = getProject(
      path.join(FIXTURE_PATH, '..', 'test-project', 'redwood.toml')
    )
    const cells = getCells(project)
    cells.forEach((cell) => {
      // Remove the leading section of the path because it'll be dependant on the host machine
      cell.path = cell.path.substring(FIXTURE_PATH.length)
    })
    expect(cells).toMatchSnapshot()
  })
})

describe('From inside the empty-project fixture', () => {
  it.todo('...')
})

describe('From inside the example-todo-main fixture', () => {
  it.todo('...')
})

describe('From inside the example-todo-main-with-errors fixture', () => {
  it.todo('...')
})
