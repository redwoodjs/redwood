// The `redwood dev` command runs the api and web development servers.
// Usage:
// $ redwood dev

import { useEffect } from 'react'
import concurrently from 'concurrently'
import { getPaths } from '@redwoodjs/core'

import { asyncExec } from 'src/lib'

export default ({ args }) => {
  useEffect(() => {
    const runCommands = async () => {
      const { base } = getPaths()
      const availableWatchers = {
        db: `cd ${base}/api && yarn prisma2 generate --watch`,
        api: `cd ${base}/api && yarn dev-server`,
        web: `cd ${base}/web && yarn webpack-dev-server --config ../node_modules/@redwoodjs/scripts/config/webpack.development.js`,
      }

      // The user can do something like `$ yarn rw dev api,web` or just `yarn rw dev`
      const subcommandToRun = args?.[0]?.[1]

      // API requires a Prisma client to launch, but the Prisma client generation code is
      // slower than the dev-server. This fixes that race condition.
      await asyncExec(
        `cd ${base}/api && yarn prisma2 migrate up --experimental --create-db && yarn prisma2 generate`
      )

      let runCommands = Object.keys(availableWatchers)
      if (subcommandToRun) {
        // TODO: Split by ' ' char?
        const watchers = subcommandToRun.split(',')
        runCommands = watchers.filter((n) => runCommands.includes(n))
      }

      // maybe we just generate before?

      concurrently(
        runCommands.map((name) => ({
          command: availableWatchers[name],
          name,
        })),
        {
          restartTries: 3,
          restartDelay: 100,
          prefix: 'name',
        }
      )
    }

    runCommands()
  }, [args])

  return null
}

export const commandProps = {
  name: 'dev',
  alias: 'd',
  description: 'Launch api, web and prisma dev servers.',
}
