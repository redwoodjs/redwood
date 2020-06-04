import terminalLink from 'terminal-link'

import { getPaths, runCommandTask } from 'src/lib'

export const command = 'seed'
export const description = 'Seed your database with test data'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#db-seed'
    )}`
  )
}
export const handler = () => {
  runCommandTask(
    [
      {
        title: 'Seeding your database...',
        cmd: 'node',
        args: ['seeds.js'],
        opts: { cwd: getPaths().api.db },
      },
    ],
    { verbose: true }
  )
}
