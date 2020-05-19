import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'test [app..]'
export const desc = 'Run Jest tests for api and web.'
export const builder = {
  app: { choices: ['api', 'web'], default: ['api', 'web'] },
}

export const handler = async ({ app }) => {
  const { base: BASE_DIR } = getPaths()
  const execCommands = {
    api: {
      cwd: `${BASE_DIR}/api`,
      cmd: 'yarn jest',
      args: [
        '--passWithNoTests',
        '--config ../node_modules/@redwoodjs/core/config/jest.config.api.js',
      ],
    },
    web: {
      cwd: `${BASE_DIR}/web`,
      cmd: 'yarn jest',
      args: [
        '--passWithNoTests',
        '--config ../node_modules/@redwoodjs/core/config/jest.config.web.js',
      ],
    },
  }

  const tasks = new Listr(
    app.map((appName) => {
      const { cmd, args, cwd } = execCommands[appName]
      return {
        title: `Running '${appName}' jest tests`,
        task: () => {
          return execa(cmd, args, {
            stdio: 'inherit',
            shell: true,
            cwd,
          })
        },
      }
    }),
    {
      renderer: VerboseRenderer,
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
