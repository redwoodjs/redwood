// The `redwood dev` command runs the api and web development servers.
// Usage:
// $ redwood dev

import concurrently from 'concurrently'
import { getPaths } from '@redwoodjs/core'

const Dev = ({ args }) => {
  const { base } = getPaths()
  const availableWatchers = {
    api: `cd ${base}/api && yarn dev-server`,
    web: `cd ${base}/web && yarn webpack-dev-server --config ./config/webpack.dev.js`,
    db: `cd ${base}/api && yarn prisma2 generate --watch`,
  }

  // The user can do something like `$ yarn rw dev api,web` or just `yarn rw dev`
  const subcommandToRun = args?.[0]?.[1]

  let runCommands = Object.keys(availableWatchers)
  if (subcommandToRun) {
    // TODO: Split by ' ' char?
    const watchers = subcommandToRun.split(',')
    runCommands = watchers.filter((n) => runCommands.includes(n))
  }

  concurrently(
    runCommands.map((name) => ({
      command: availableWatchers[name],
      name,
    })),
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
