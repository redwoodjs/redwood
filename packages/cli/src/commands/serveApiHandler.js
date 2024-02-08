import execa from 'execa'

import { getPaths } from '@redwoodjs/project-config'

export const apiServerFileHandler = async (argv) => {
  await execa(
    'yarn',
    [
      'node',
      'server.js',
      '--port',
      argv.port,
      '--apiRootPath',
      argv.apiRootPath,
    ],
    {
      cwd: getPaths().api.dist,
      stdio: 'inherit',
    }
  )
}
