import path from 'node:path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodService } from '../service/service'

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '__fixtures__'
)
const FIXTURE_PROJECTS = [
  'empty-project',
  'example-todo-main',
  'example-todo-main-with-errors',
  'test-project',
]

describe.each(FIXTURE_PROJECTS)(
  "From within the '%s' fixture",
  (PROJECT_NAME) => {
    // Setup RWJS_CWD to point to the fixture project
    const PROJECT_PATH = path.join(FIXTURE_PATH, PROJECT_NAME)
    const RWJS_CWD = process.env.RWJS_CWD
    beforeAll(() => {
      process.env.RWJS_CWD = PROJECT_PATH
    })
    afterAll(() => {
      process.env.RWJS_CWD = RWJS_CWD
    })

    it('returns the correct services', () => {
      const services = RedwoodService.parseServices()
      expect(services.length).toMatchSnapshot('services count')
      for (let i = 0; i < services.length; i++) {
        const service = services[i]
        service.filepath = stripAndFormatPathForTesting(
          service.filepath,
          PROJECT_PATH
        )
        for (let j = 0; j < service.functions.length; j++) {
          service.functions[j].filepath = stripAndFormatPathForTesting(
            service.functions[j].filepath,
            PROJECT_PATH
          )
        }

        expect(service).toMatchSnapshot(`${service.filepath} content`)
        expect(service.getErrors()).toMatchSnapshot(
          `${service.filepath} errors`
        )
        expect(service.getWarnings()).toMatchSnapshot(
          `${service.filepath} warnings`
        )
      }
    })
  }
)
