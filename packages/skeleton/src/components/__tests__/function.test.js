import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { extractFunctions } from '../function'
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

  it('returns the correct functions without a project', () => {
    const functions = extractFunctions(undefined)
    functions.forEach((func) => {
      func.executeAdditionalChecks()
      func.filepath = stripAndFormatPathForTesting(func.filepath, PROJECT_PATH)
      expect(func).toMatchSnapshot(func.filepath)
    })
    expect(functions.length).toMatchSnapshot('function count')
  })

  it('returns the correct functions with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const functions = extractFunctions(project)
    functions.forEach((func) => {
      func.executeAdditionalChecks()
      func.filepath = stripAndFormatPathForTesting(func.filepath, PROJECT_PATH)
      expect(func).toMatchSnapshot(func.filepath)
    })
    expect(functions.length).toMatchSnapshot('function count')
  })
})
