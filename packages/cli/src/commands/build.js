import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

const apiExists = fs.existsSync(getPaths().api.src)
const webExists = fs.existsSync(getPaths().web.src)

const optionDefault = (webExists, apiExists) => {
  let options = []
  if (webExists) options.push('web')
  if (apiExists) options.push('api')
  return options
}

export const command = 'build [app..]'
export const desc = 'Build for production.'
export const builder = {
  app: {
    choices: ['api', 'web'],
    default: optionDefault(webExists, apiExists),
  },
  verbose: { type: 'boolean', default: false, alias: ['v'] },
  stats: { type: 'boolean', default: false },
}

export const handler = async ({
  app = ['api', 'web'],
  verbose = false,
  stats = false,
}) => {
  if (app.includes('api')) {
    try {
      await generatePrismaClient({ verbose, force: true })
    } catch (e) {
      console.log(c.error(e.message))
      process.exit(1)
    }
  }

  const execCommandsForApps = {
    api: {
      // must use path.join() here, and for 'web' below, to support Windows
      cwd: path.join(getPaths().base, 'api'),
      cmd: 'yarn cross-env NODE_ENV=production babel src --out-dir dist',
    },
    web: {
      cwd: path.join(getPaths().base, 'web'),
      cmd: `yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.${
        stats ? 'stats' : 'production'
      }.js`,
    },
  }

  if (stats) {
    app = ['web']
    console.log(
      ' ⏩ Skipping `api` build because stats only works for Webpack at the moment.'
    )
  }

  const tasks = new Listr(
    app.map((appName) => {
      const { cwd, cmd } = execCommandsForApps[appName]
      return {
        title: `Building "${appName}"${(stats && ' for stats') || ''}...`,
        task: () => {
          return execa(cmd, undefined, {
            stdio: verbose ? 'inherit' : 'pipe',
            shell: true,
            cwd,
          })
        },
      }
    }),
    {
      renderer: verbose && VerboseRenderer,
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
