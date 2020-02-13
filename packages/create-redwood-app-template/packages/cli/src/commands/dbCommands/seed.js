import execa from 'execa'

import { getPaths } from 'src/lib'

export const command = 'seed'
export const desc = 'Seed your database with test data.'

export const handler = () => {
  execa('node', ['seeds.js'], {
    shell: true,
    cwd: getPaths().api.db,
    stdio: 'inherit',
  })
}
