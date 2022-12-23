import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodProject } from '../project'
import { extractSDLs } from '../sdl/sdl'

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

  it('returns the correct SDLs without a project', () => {
    const sdls = extractSDLs(undefined)
    sdls.forEach((sdl) => {
      sdl.executeAdditionalChecks()
      sdl.filepath = stripAndFormatPathForTesting(sdl.filepath, PROJECT_PATH)
      sdl.queries.forEach((query) => {
        query.filepath = stripAndFormatPathForTesting(
          query.filepath,
          PROJECT_PATH
        )
      })
      sdl.mutations.forEach((mutation) => {
        mutation.filepath = stripAndFormatPathForTesting(
          mutation.filepath,
          PROJECT_PATH
        )
      })
      expect(sdl).toMatchSnapshot(sdl.filepath)
    })
    expect(sdls.length).toMatchSnapshot('SDL count')
  })

  it('returns the correct SDLs with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const sdls = extractSDLs(project)
    sdls.forEach((sdl) => {
      sdl.executeAdditionalChecks()
      sdl.filepath = stripAndFormatPathForTesting(sdl.filepath, PROJECT_PATH)
      sdl.queries.forEach((query) => {
        query.filepath = stripAndFormatPathForTesting(
          query.filepath,
          PROJECT_PATH
        )
      })
      sdl.mutations.forEach((mutation) => {
        mutation.filepath = stripAndFormatPathForTesting(
          mutation.filepath,
          PROJECT_PATH
        )
      })
      expect(sdl).toMatchSnapshot(sdl.filepath)
    })
    expect(sdls.length).toMatchSnapshot('SDL count')
  })
})
