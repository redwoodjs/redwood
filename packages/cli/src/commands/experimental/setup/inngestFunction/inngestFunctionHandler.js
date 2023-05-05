import execa from 'execa'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

export const handler = async (options) => {
  const tasks = new Listr([
    // {
    //   title: `Adding Inngest setup packages ...`,
    //   task: async () => {
    //     await execa('yarn', ['add', '-D', 'inngest-setup-redwoodjs'], {
    //       cwd: getPaths().base,
    //     })
    //   },
    // },
    {
      title: `Setting up a function ...`,
      task: async () => {
        console.debug('inngestFunctionHandler.js handler() options:', options)

        const pluginCommands = [
          'inngest-setup-redwoodjs',
          'function',
          {
            name: options.name,
            eventName: options.eventName,
            graphql: options.graphql,
            force: options.force,
          },
        ]

        console.debug(
          'inngestFunctionHandler.js handler() pluginCommands:',
          pluginCommands
        )

        await execa('yarn', ...pluginCommands, {
          cwd: getPaths().base,
          shell: true,
          stdio: 'inherit',
        })
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
