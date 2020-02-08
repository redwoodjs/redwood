import execa from 'execa'

import { getPaths } from 'src/lib'

export const command = 'seed'
export const desc = 'Seed your database with test data.'

export const handler = async () => {
  const subprocess = execa('node', ['seeds.js'], {
    shell: true,
    cwd: getPaths().api.db,
  })
  subprocess.stdout.pipe(process.stdout)
  subprocess.stderr.pipe(process.stderr)
  await subprocess
}
