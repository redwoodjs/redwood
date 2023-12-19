import execa from 'execa'

import { getPaths } from '@redwoodjs/project-config'

export const webSsrServerHandler = async () => {
  await execa('yarn', ['rw-serve-fe'], {
    cwd: getPaths().web.base,
    stdio: 'inherit',
    shell: true,
  })
}

export const webServerHandler = async (argv) => {
  await execa(
    'yarn',
    [
      'rw-web-server',
      '--port',
      argv.port,
      '--socket',
      argv.socket,
      '--api-host',
      argv.apiHost,
    ],
    {
      cwd: getPaths().base,
      stdio: 'inherit',
      shell: true,
    }
  )
}
