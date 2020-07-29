import { execSync } from 'child_process'

import Listr from 'listr'
import terminalLink from 'terminal-link'
import { getProject } from '@redwoodjs/structure'
import paramCase from 'param-case'
import { writeFilesTask } from 'src/x/listr/writeFilesTask'

import c from 'src/lib/colors'

import { templateForComponentFile } from '../helpers'

const COMPONENT_SUFFIX = 'Page'
const REDWOOD_WEB_PATH_NAME = 'pages'

export const templates = (
  { name, path, routes },
  { project = getProject() } = {}
) => {
  const page = templateForComponentFile(
    {
      name,
      suffix: COMPONENT_SUFFIX,
      webPathSection: REDWOOD_WEB_PATH_NAME,
      generator: 'page',
      templatePath: 'page.js.template',
      templateVars: { path },
    },
    project.pathHelper
  )
  const test = templateForComponentFile(
    {
      name,
      suffix: COMPONENT_SUFFIX,
      extension: '.test.js',
      webPathSection: REDWOOD_WEB_PATH_NAME,
      generator: 'page',
      templatePath: 'test.js.template',
      templateVars: { path },
    },
    project.pathHelper
  )
  const stories = templateForComponentFile(
    {
      name,
      suffix: COMPONENT_SUFFIX,
      extension: '.stories.js',
      webPathSection: REDWOOD_WEB_PATH_NAME,
      generator: 'page',
      templatePath: 'stories.js.template',
      templateVars: { path },
    },
    project.pathHelper
  )

  return [
    {
      path: stories[0],
      contents: stories[1],
    },
    {
      path: test[0],
      contents: test[1],
    },
    {
      path: page[0],
      contents: page[1],
    },
    {
      path: project.pathHelper.web.routes,
      contents: project.router.createRouterString(routes),
      overwrite: true, // file exists
      doNotDelete: true, // do not delete
    },
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
    .option('json', {
      default: false,
      description: 'Output as JSON',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-page'
      )}`
    )
}

const cleanPathArgForWindows = (path) => {
  if (path && process.platform === 'win32') {
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
      return path.replace(new RegExp(`^${slashPath}?`), '/')
    } catch {
      // probably using PowerShell or cmd, in which case no special handling
      // is needed
    }
  }
}

export const handler = async ({ name, path, force, json }) => {
  path = cleanPathArgForWindows(path)
  // Generate a path if the user didn't supply one
  path = path ?? `/${paramCase(name)}`

  const newRoute = getProject().router.createRouteString(name, path)
  const files = await templates({ name, path, routes: [newRoute] })

  if (json) {
    console.log(JSON.stringify(files, 2))
  } else {
    const tasks = new Listr(
      [
        {
          title: 'Generating page files...',
          task: async () => {
            return writeFilesTask(files, { overwrite: force })
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
}
