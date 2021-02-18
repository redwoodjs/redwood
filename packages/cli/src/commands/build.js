import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { getPaths, getConfig } from 'src/lib'
import c from 'src/lib/colors'
import { generatePrismaClient } from 'src/lib/generatePrismaClient'

export const command = 'build [side..]'
export const description = 'Build for production'

export const builder = (yargs) => {
  const apiExists = fs.existsSync(getPaths().api.src)
  const webExists = fs.existsSync(getPaths().web.src)

  const optionDefault = (apiExists, webExists) => {
    let options = []
    if (apiExists) options.push('api')
    if (webExists) options.push('web')
    return options
  }

  yargs
    .positional('side', {
      choices: ['api', 'web'],
      default: optionDefault(apiExists, webExists),
      description: 'Which side(s) to build',
      type: 'array',
    })
    .option('stats', {
      default: false,
      description: `Use ${terminalLink(
        'Webpack Bundle Analyzer',
        'https://github.com/webpack-contrib/webpack-bundle-analyzer'
      )}`,
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      description: 'Print more',
      type: 'boolean',
    })
    .option('prerender', {
      default: true,
      description: 'Prerender after building web',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#build'
      )}`
    )
}

export const handler = async ({
  side = ['api', 'web'],
  verbose = false,
  stats = false,
  prerender,
}) => {
  const execCommandsForSides = {
    api: {
      // must use path.join() here, and for 'web' below, to support Windows
      cwd: path.join(getPaths().base, 'api'),
      cmd:
        "yarn cross-env NODE_ENV=production babel src --out-dir dist --delete-dir-on-start --extensions .ts,.js --ignore '**/*.test.ts,**/*.test.js,**/__tests__'",
    },
    web: {
      cwd: path.join(getPaths().base, 'web'),
      cmd: `yarn cross-env NODE_ENV=production webpack --config ../node_modules/@redwoodjs/core/config/webpack.${
        stats ? 'stats' : 'production'
      }.js`,
    },
  }

  if (stats) {
    side = ['web']
    console.log(
      ' ⏩ Skipping `api` build because stats only works for Webpack at the moment.'
    )
  }

  const listrTasks = side.map((sideName) => {
    const { cwd, cmd } = execCommandsForSides[sideName]
    return {
      title: `Building "${sideName}"${(stats && ' for stats') || ''}...`,
      task: () => {
        return execa(cmd, undefined, {
          stdio: verbose ? 'inherit' : 'pipe',
          shell: true,
          cwd,
        })
      },
    }
  })

  // Additional tasks, apart from build
  if (side.includes('api')) {
    try {
      await generatePrismaClient({
        verbose,
        force: true,
        schema: getPaths().api.dbSchema,
      })
    } catch (e) {
      console.log(c.error(e.message))
      process.exit(1)
    }
  }

  if (side.includes('web')) {
    // Clean web dist folder, _before_ building
    listrTasks.unshift({
      title: 'Cleaning web/dist',
      task: () => {
        return execa('rimraf dist/*', undefined, {
          stdio: verbose ? 'inherit' : 'pipe',
          shell: true,
          cwd: getPaths().web.base,
        })
      },
    })

    // Prerender _after_ web build
    if (getConfig().web.experimentalPrerender && prerender) {
      listrTasks.push({
        title: 'Prerendering web...',
        task: () => {
          return execa('yarn rw prerender', undefined, {
            stdio: verbose ? 'inherit' : 'pipe',
            shell: true,
            cwd: getPaths().base,
          })
        },
      })
    }
  }

  const tasks = new Listr(listrTasks, {
    renderer: verbose && VerboseRenderer,
  })

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
