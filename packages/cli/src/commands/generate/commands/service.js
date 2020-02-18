import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pluralize from 'pluralize'

import { generateTemplate, getPaths, writeFilesTask } from 'src/lib'

export const files = async ({ model: name, crud }) => {
  const pluralCamelName = camelcase(pluralize(name))
  const servicePath = path.join(
    getPaths().api.services,
    pluralCamelName,
    `${pluralCamelName}.js`
  )
  const readmePath = path.join(
    getPaths().api.services,
    pluralCamelName,
    `${pluralCamelName}.mdx`
  )
  const testPath = path.join(
    getPaths().api.services,
    pluralCamelName,
    `${pluralCamelName}.test.js`
  )

  const serviceTemplate = generateTemplate(
    path.join('service', 'service.js.template'),
    { name, isCrud: crud }
  )
  const readmeTemplate = generateTemplate(
    path.join('service', 'readme.mdx.template'),
    { name, isCrud: crud }
  )
  const testTemplate = generateTemplate(
    path.join('service', 'test.js.template'),
    { name, isCrud: crud }
  )

  return {
    [servicePath]: serviceTemplate,
    [readmePath]: readmeTemplate,
    [testPath]: testTemplate,
  }
}

export const command = 'service <model>'
export const desc = 'Generate a service object.'
export const builder = {
  crud: { type: 'boolean', default: true },
  force: { type: 'boolean', default: false },
}
export const handler = async ({ model, crud, force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating service files...',
        task: async () => {
          const f = await files({ model, crud })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
    ],
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    // do nothing
  }
}
