import { execSync } from 'child_process'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import terminalLink from 'terminal-link'

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
  const storiesFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: '.stories.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'page',
    templatePath: 'stories.js.template',
    templateVars: rest,
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [pageFile, testFile, storiesFile].reduce(
    (acc, [outputPath, content]) => {
      return {
        [outputPath]: content,
        ...acc,
      }
    },
    {}
  )
}

export const routes = ({ name, path }) => {
  return [
    `<Route path="${path}" page={${pascalcase(name)}Page} name="${camelcase(
      name
    )}" />`,
  ]
}

export const command = 'page <name> [path]'
export const description = 'Generate a page and route component'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the page',
      type: 'string',
    })
    .positional('path', {
      description: 'URL path to the page. Defaults to name',
      type: 'string',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing files',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-page'
      )}`
    )
}

export const handler = async ({ name, path, force }) => {
  if (process.platform === 'win32') {
    // running `yarn rw g page home /` on Windows using GitBash
    // POSIX-to-Windows path conversion will kick in.
    // See https://github.com/git-for-windows/build-extra/blob/d715c9e/ReleaseNotes.md
    // As a workaround we try to detect when this has happened, and reverse
    // the action

    try {
      // `cygpath -m /` will return something like 'C:/Program Files/Git/\n'
      const slashPath = execSync('cygpath -m /', {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim()

      // `yarn rw g page home /` =>
      //   page === 'C:/Program Files/Git'
      // `yarn rw g page about /about` =>
      //   page === 'C:/Program Files/Git/about'
      // Sometimes there is a / after 'Git' to match, sometimes there isn't
      path = path.replace(new RegExp(`^${slashPath}?`), '/')
    } catch {
      // probably using PowerShell or cmd, in which case no special handling
      // is needed
    }
  }

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
