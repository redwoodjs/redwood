import fs from 'fs'
import path from 'path'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'run side'
export const description = 'Run servers for api, and web, in production'
export const builder = (yargs) => {
  yargs
    .positional('side', {
      default: 'api',
      description: 'Which server to start',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#run'
      )}`
    )
}

export const handler = async ({ side = 'api' }) => {
  // Currently we only support api anyway
  // Not sure if we will support web in the future
  if (side === 'api') {
    if (
      !fs.existsSync(
        path.join(getPaths().base, 'node_modules', '.bin', 'api-server')
      )
    ) {
      console.error(c.error('RedwoodJS API server dependency not found'))
      console.error(
        'Please install @redwoodjs/api-server to use this command\n'
      )

      console.log(
        `Run ${c.green('yarn workspace api add @redwoodjs/api-server')} \n`
      )

      process.exit(1)
    }

    await execa('yarn api-server', ['--functions', './dist/functions'], {
      cwd: getPaths().api.base,
      shell: true,
      cleanup: true,
      stdio: 'inherit',
    })
  }
}
