import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { extractDirectives } from '../directive'
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

  it('returns the correct directives without a project', () => {
    const directives = extractDirectives(undefined)
    directives.forEach((directive) => {
      directive.executeAdditionalChecks()
      directive.filepath = stripAndFormatPathForTesting(
        directive.filepath,
        PROJECT_PATH
      )
      expect(directive).toMatchSnapshot(directive.filepath)
    })
    expect(directives.length).toMatchSnapshot('directive count')
  })

  it('returns the correct directives with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const directives = extractDirectives(project)
    directives.forEach((directive) => {
      directive.executeAdditionalChecks()
      directive.filepath = stripAndFormatPathForTesting(
        directive.filepath,
        PROJECT_PATH
      )
      expect(directive).toMatchSnapshot(directive.filepath)
    })
    expect(directives.length).toMatchSnapshot('directive count')
  })
})
