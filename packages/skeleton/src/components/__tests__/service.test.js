import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodProject } from '../project'
import { extractServices } from '../service/service'

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

  it('returns the correct services without a project', () => {
    const services = extractServices(undefined)
    services.forEach((service) => {
      service.executeAdditionalChecks()
      service.filepath = stripAndFormatPathForTesting(
        service.filepath,
        PROJECT_PATH
      )
      service.functions.forEach((func) => {
        func.filepath = stripAndFormatPathForTesting(
          func.filepath,
          PROJECT_PATH
        )
      })
      expect(service).toMatchSnapshot(service.filepath)
    })
    expect(services.length).toMatchSnapshot('service count')
  })

  it('returns the correct services with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const services = extractServices(project)
    services.forEach((service) => {
      service.executeAdditionalChecks()
      service.filepath = stripAndFormatPathForTesting(
        service.filepath,
        PROJECT_PATH
      )
      service.functions.forEach((func) => {
        func.filepath = stripAndFormatPathForTesting(
          func.filepath,
          PROJECT_PATH
        )
      })
      expect(service).toMatchSnapshot(service.filepath)
    })
    expect(services.length).toMatchSnapshot('service count')
  })
})
