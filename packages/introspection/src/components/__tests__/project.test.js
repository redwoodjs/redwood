import path from 'node:path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
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

    it('returns the correct project', async () => {
      const project = new RedwoodProject()

      const originalFilepath = project.filepath
      const strippedFilepath = stripAndFormatPathForTesting(
        project.filepath,
        PROJECT_PATH
      )

      project.filepath = strippedFilepath
      expect(project).toMatchSnapshot('project')
      project.filepath = originalFilepath

      const errors = await project.getErrors()
      for (let i = 0; i < errors.length; i++) {
        errors[i].component.filepath = stripAndFormatPathForTesting(
          errors[i].component.filepath,
          PROJECT_PATH
        )
      }
      expect(errors).toMatchSnapshot('errors')

      const warnings = await project.getWarnings()
      for (let i = 0; i < warnings.length; i++) {
        warnings[i].component.filepath = stripAndFormatPathForTesting(
          warnings[i].component.filepath,
          PROJECT_PATH
        )
      }
      expect(warnings).toMatchSnapshot('warnings')

      const cells = await project.getCells()
      for (let i = 0; i < cells.length; i++) {
        cells[i].filepath = stripAndFormatPathForTesting(
          cells[i].filepath,
          PROJECT_PATH
        )
      }
      expect(cells).toMatchSnapshot('cells')

      const pages = await project.getPages()
      for (let i = 0; i < pages.length; i++) {
        pages[i].filepath = stripAndFormatPathForTesting(
          pages[i].filepath,
          PROJECT_PATH
        )
      }
      expect(pages).toMatchSnapshot('pages')

      const router = await project.getRouter()
      router.filepath = stripAndFormatPathForTesting(
        router.filepath,
        PROJECT_PATH
      )
      for (let i = 0; i < router.routes.length; i++) {
        router.routes[i].filepath = stripAndFormatPathForTesting(
          router.routes[i].filepath,
          PROJECT_PATH
        )
      }
      expect(router).toMatchSnapshot('router')

      const services = await project.getServices()
      for (let i = 0; i < services.length; i++) {
        services[i].filepath = stripAndFormatPathForTesting(
          services[i].filepath,
          PROJECT_PATH
        )
        for (let j = 0; j < services[i].functions.length; j++) {
          services[i].functions[j].filepath = stripAndFormatPathForTesting(
            services[i].functions[j].filepath,
            PROJECT_PATH
          )
        }
      }
      expect(services).toMatchSnapshot('services')

      const sides = await project.getSides()
      for (let i = 0; i < sides.length; i++) {
        sides[i].filepath = stripAndFormatPathForTesting(
          sides[i].filepath,
          PROJECT_PATH
        )
      }
      expect(sides).toMatchSnapshot('sides')

      const complexity = await project.getComplexity()
      expect(complexity).toMatchSnapshot('complexity metric')
    })
  }
)
