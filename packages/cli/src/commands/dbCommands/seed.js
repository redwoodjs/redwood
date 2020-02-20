import { getPaths, runCommandTask } from 'src/lib'

export const command = 'seed'
export const desc = 'Seed your database with test data.'
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
