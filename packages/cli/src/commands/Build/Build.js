// The `redwood buid` command builds the app.
// Usage:
// $ redwood build

import concurrently from 'concurrently'
import { getPaths } from '@redwoodjs/core'

export default ({ args }) => {
  const { base } = getPaths()
  const availableWatchers = {
    api: `cd ${base}/api && NODE_ENV=production yarn babel src --out-dir dist`,
    web: `cd ${base}/web && yarn webpack --config config/webpack.prod.js`,
  }

  // The user can do something like `$ yarn rw build api,web` or just `yarn rw build`
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
  name: 'build',
  description: 'Build the Redwood api and web packages.',
}
