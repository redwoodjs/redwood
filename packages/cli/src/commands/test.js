import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'test [side..]'
export const description = 'Run Jest tests for api and web'
export const builder = (yargs) => {
  yargs
    .positional('side', {
      choices: ['api', 'web'],
      default: ['api', 'web'],
      description: 'Which side(s) to test',
      type: 'array',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#test'
      )}`
    )
}

export const handler = async ({ side }) => {
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
    side.map((sideName) => {
      const { cmd, args, cwd } = execCommands[sideName]
      return {
        title: `Running '${sideName}' jest tests`,
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
