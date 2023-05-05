import execa from 'execa'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

const formatFlags = (flags) => {
  let formattedFlags = ''

  for (const key in flags) {
    const value = flags[key]

    if (value !== undefined) {
      formattedFlags += `--${key}=${value} `
    }
  }

  return formattedFlags.trim()
}

export const handler = async (options) => {
  const tasks = new Listr([
    // check if inngest-setup-redwoodjs installed and exit if not and warn
    {
      task: async () => {
        const flags = {
          eventName: options.eventName,
          type: options.type,
          graphql: options.graphql,
          force: options.force,
          operationType: undefined,
        }

        await execa.command(
          `yarn inngest-setup-redwoodjs function ${options.name} ${formatFlags(
            flags
          )}`,
          {
            cwd: getPaths().base,
            stdio: 'inherit',
          }
        )
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
