import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'

import { writeFilesTask, addRoutesToRouterTask } from 'src/lib'
import c from 'src/lib/colors'

import { templateForComponentFile, pathName } from '../helpers'

const COMPONENT_SUFFIX = 'Page'
const REDWOOD_WEB_PATH_NAME = 'pages'

export const files = ({ name, ...rest }) => {
  const pageFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'page',
    templatePath: 'page.js.template',
    templateVars: rest,
  })
  const testFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: '.test.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'page',
    templatePath: 'test.js.template',
    templateVars: rest,
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [pageFile, testFile].reduce((acc, [outputPath, content]) => {
    return {
      [outputPath]: content,
      ...acc,
    }
  }, {})
}

export const routes = ({ name, path }) => {
  return [
    `<Route path="${path}" page={${pascalcase(name)}Page} name="${camelcase(
      name
    )}" />`,
  ]
}

export const command = 'page <name> [path]'
export const desc = 'Generate a page component.'
export const builder = { force: { type: 'boolean', default: false } }

export const handler = async ({ name, path, force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating page files...',
        task: async () => {
          const f = await files({ name, path: pathName(path, name) })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
      {
        title: 'Updating routes file...',
        task: async () => {
          addRoutesToRouterTask(routes({ name, path: pathName(path, name) }))
        },
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
