import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

export const command = 'build [app..]'
export const desc = 'Build for production.'
export const builder = {
  app: { choices: ['api', 'web'], default: ['api', 'web'] },
  verbose: { type: 'boolean', default: false, alias: ['v'] },
  stats: { type: 'boolean', default: false },
}

export const handler = async ({
  app = ['api', 'web'],
  verbose = false,
  stats = false,
}) => {
  const { base: BASE_DIR } = getPaths()

  if (app.includes('api')) {
    await generatePrismaClient({ verbose, force: true })
  }

  const execCommandsForApps = {
    api: {
      cwd: `${BASE_DIR}/api`,
      cmd: 'NODE_ENV=production babel src --out-dir dist',
    },
    web: {
      cwd: `${BASE_DIR}/web`,
      cmd: `webpack --config ../node_modules/@redwoodjs/core/config/webpack.${
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
  }
}
