import { execSync } from 'child_process'

import camelcase from 'camelcase'
import Listr from 'listr'
import pascalcase from 'pascalcase'

import { addRoutesToRouterTask, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

import {
  createYargsForComponentGeneration,
  pathName,
  templateForComponentFile,
} from '../helpers'

const COMPONENT_SUFFIX = 'Page'
const REDWOOD_WEB_PATH_NAME = 'pages'

export const paramVariants = (path) => {
  const param = path?.match(/(\{[\w:]+\})/)?.[1]
  const paramName = param?.replace(/:[^}]+/, '').slice(1, -1)

  if (param === undefined) {
    return {
      propParam: '',
      propValueParam: '',
      argumentParam: '',
      paramName: '',
      paramValue: '',
    }
  }

  // "42" is just a value used for demonstrating parameter usage in the
  // generated page-, test-, and story-files.
  return {
    propParam: `{ ${paramName} }`,
    propValueParam: `${paramName}="42" `,
    argumentParam: `{ ${paramName}: '42' }`,
    paramName,
    paramValue: ' 42',
  }
}

export const files = ({ name, tests, stories, typescript, ...rest }) => {
  const pageFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: typescript ? '.tsx' : '.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'page',
    templatePath: 'page.js.template',
    templateVars: rest,
  })

  const testFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: typescript ? '.test.tsx' : '.test.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'page',
    templatePath: 'test.js.template',
    templateVars: rest,
  })

  const storiesFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: typescript ? '.stories.tsx' : '.stories.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'page',
    templatePath: 'stories.js.template',
    templateVars: rest,
  })

  const files = [pageFile]

  if (tests) {
    files.push(testFile)
  }

  if (stories) {
    files.push(storiesFile)
  }

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
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

// @NOTE: Not exporting handler from function
// As pages need a special handler
export const {
  command,
  description,
  builder,
} = createYargsForComponentGeneration({
  componentName: 'page',
  filesFn: files,
})

export const handler = async ({
  name,
  path,
  force,
  tests = true,
  stories = true,
  typescript = false,
}) => {
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
          path = pathName(path, name)
          const f = await files({
            name,
            path,
            tests,
            stories,
            typescript,
            ...paramVariants(path),
          })
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
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
