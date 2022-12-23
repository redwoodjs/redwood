import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodProject } from '../project'
import { extractTOMLs } from '../toml'

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

  it('returns the correct TOMLs without a project', () => {
    const tomls = extractTOMLs(undefined)
    tomls.forEach((toml) => {
      toml.executeAdditionalChecks()
      toml.filepath = stripAndFormatPathForTesting(toml.filepath, PROJECT_PATH)
      expect(toml).toMatchSnapshot(toml.filepath)
    })
    expect(tomls.length).toMatchSnapshot('toml count')
  })

  it('returns the correct TOMLs with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const tomls = extractTOMLs(project)
    tomls.forEach((toml) => {
      toml.executeAdditionalChecks()
      toml.filepath = stripAndFormatPathForTesting(toml.filepath, PROJECT_PATH)
      expect(toml).toMatchSnapshot(toml.filepath)
    })
    expect(tomls.length).toMatchSnapshot('toml count')
  })
})
