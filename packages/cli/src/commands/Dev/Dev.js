// The `redwood dev` command runs the api and web development servers.
// Usage:
// $ redwood dev

import concurrently from 'concurrently'
import { getBaseDir } from '@redwoodjs/core'

const Dev = () => {
  const baseDir = getBaseDir()

  concurrently(
    [
      {
        command: `cd ${baseDir}/web && yarn dev`,
        name: 'web',
        prefixColor: 'yellow',
      },
      {
        command: `cd ${baseDir}/api && yarn dev`,
        name: 'api',
        prefixColor: 'green',
      },
    ],
    {
      prefix: 'name',
    }
  )
  return null
}

export const commandProps = {
  name: 'dev',
  alias: 'd',
  description: 'Launch api, web and prisma dev servers',
}

export default Dev
