import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import pluralize from 'pluralize'

import {
  getPaths,
  generateTemplate,
  writeFilesTask,
  addRoutesToRouterTask,
} from 'src/lib'

export const files = ({ name }) => {
  const filename = pascalcase(pluralize.singular(name)) + 'Page'
  const outputPath = path.join(getPaths().web.pages, filename, `${filename}.js`)
  const template = generateTemplate(path.join('page', 'page.js.template'), {
    name,
    path: outputPath,
  })

  return { [outputPath]: template }
}

export const routes = ({ name, path }) => {
  return [
    `<Route path="${path ?? `/${paramCase(name)}`}" page={${pascalcase(
      name
    )}Page} name="${camelcase(name)}" />`,
  ]
}

export const command = 'page <name> [path]'
export const desc = 'Generates a page component.'
export const handler = async ({ name, path }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating page files...',
        task: async () => {
          const f = await files({ name })
          return writeFilesTask(f)
        },
      },
      {
        title: 'Updating routes file...',
        task: async () => {
          addRoutesToRouterTask(routes({ name, path }))
        },
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    // do nothing.
  }
}
