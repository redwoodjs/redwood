import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'

import { writeFilesTask, addRoutesToRouterTask } from 'src/lib'

import { templateForComponentFile } from '../helpers'

const COMPONENT_SUFFIX = 'Page'
const REDWOOD_WEB_PATH_NAME = 'pages'
const TEMPLATE_PATH = 'page/page.js.template'

export const files = ({ name, ...rest }) => {
  const [outputPath, template] = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    templatePath: TEMPLATE_PATH,
    templateVars: rest,
  })
  return { [outputPath]: template }
}

export const routes = ({ name, path }) => {
  return [
    `<Route path="${path}" page={${pascalcase(name)}Page} name="${camelcase(
      name
    )}" />`,
  ]
}

export const command = 'page <name> [path]'
export const desc = 'Generates a page component.'
export const builder = { force: { type: 'boolean', default: false } }

export const handler = async ({ name, path, force }) => {
  path = path ?? `/${paramCase(name)}`
  const tasks = new Listr(
    [
      {
        title: 'Generating page files...',
        task: async () => {
          const f = await files({ name, path })
          return writeFilesTask(f, { overwriteExisting: force })
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
