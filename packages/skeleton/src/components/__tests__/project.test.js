import path from 'path'

import { RedwoodProject } from '../project'

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '__fixtures__'
)
describe.each([
  'empty-project',
  'example-todo-main',
  'example-todo-main-with-errors',
  'test-project',
])('From within the %s fixture', (PROJECT_NAME) => {
  const PROJECT_PATH = path.join(FIXTURE_PATH, PROJECT_NAME)

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = PROJECT_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  test('Minimal project matches expectation', () => {
    const project = RedwoodProject.getProject({
      readFromCache: false,
      insertIntoCache: false,
    })
    project.filepath = project.filepath.substring(PROJECT_PATH.length)
    expect(project).toMatchSnapshot()
  })

  test.todo('Full project matches expectation')
})
