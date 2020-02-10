import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pluralize from 'pluralize'

import { generateTemplate, getPaths, writeFilesTask } from 'src/lib'

export const files = async ({ model: name, crud }) => {
  const outputPath = path.join(
    getPaths().api.services,
    `${camelcase(pluralize(name))}.js`
  )
  const template = generateTemplate(
    path.join('service', 'service.js.template'),
    { name, isCrud: crud }
  )

  return { [outputPath]: template }
}

export const command = 'service <model>'
export const desc = 'Generate a service object.'
export const builder = {
  crud: { type: 'boolean', default: true },
  force: { type: 'boolean', default: true },
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
