import execa from 'execa'

import { getPaths } from '@redwoodjs/project-config'

export const webSsrServerHandler = async () => {
  await execa('yarn', ['rw-serve-fe'], {
    cwd: getPaths().web.base,
    stdio: 'inherit',
    shell: true,
  })
}
