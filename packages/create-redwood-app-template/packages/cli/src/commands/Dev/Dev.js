// The `redwood dev` command runs the api and web development servers.
// Usage:
// $ redwood dev

import concurrently from 'concurrently'
import { getPaths } from '@redwoodjs/core'

const Dev = () => {
  const redwoodPaths = getPaths()

  concurrently(
    [
      {
        command: `cd ${redwoodPaths.base}/web && yarn webpack-dev-server --config ./config/webpack.dev.js`,
        name: 'web',
        prefixColor: 'yellow',
      },
      {
        command: `cd ${redwoodPaths.base}/api && yarn prisma2 generate --watch`,
        name: 'database',
        prefixColor: 'yellow',
      },
      {
        command: `cd ${redwoodPaths.base}/api && yarn dev-server`,
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
