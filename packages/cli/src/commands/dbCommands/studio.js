import path from 'path'
import fs from 'fs'

import terminalLink from 'terminal-link'

import { runCommandTask, getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'studio'
export const description = 'Start Prisma Studio'

export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#db-studio'
    )}`
  )
}

export const handler = async () => {
  // No schema, no studio.
  if (!fs.existsSync(getPaths().api.dbSchema)) {
    console.log(
      `${c.warning(
        '[warning]'
      )} cannot start Prisma Studio; schema missing (${c.info(
        // So we're not hard coding schema.prisma's relative location
        path.relative(getPaths().base, getPaths().api.dbSchema)
      )}).`
    )
    return
  }

  await runCommandTask(
    [
      {
        title: 'Starting Prisma Studio...',
        cmd: 'yarn prisma',
        args: ['studio', '--experimental'],
      },
    ],
    { verbose: true }
  )
}
