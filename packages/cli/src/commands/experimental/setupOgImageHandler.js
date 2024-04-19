import path from 'path'

import fs from 'fs-extra'
import { Listr } from 'listr2'
import { format } from 'prettier'

import { addWebPackages } from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, getConfig, getPrettierOptions } from '../../lib'
import c from '../../lib/colors'

import { command, description, EXPERIMENTAL_TOPIC_ID } from './setupOgImage'
import { printTaskEpilogue } from './util'

export const handler = async ({ force, verbose }) => {
  const rwPaths = getPaths()
  const rwConfig = getConfig()
  const rootPkgJson = fs.readJsonSync(path.join(rwPaths.base, 'package.json'))
  const projectVersion = rootPkgJson.devDependencies['@redwoodjs/core']

  const tasks = new Listr(
    [
      {
        title: 'Check prerequisites',
        skip: force,
        task: () => {
          if (rwConfig.experimental?.streamingSsr?.enabled !== true) {
            throw new Error(
              'This feature requires the experimental streaming SSR feature to be enabled.',
            )
          }
        },
      },
      addWebPackages([`@redwoodjs/ogimage-gen@${projectVersion}`]),
      {
        title: 'Adding middleware to the server entry file',
        task: async () => {
          // TODO: Execute the codemod to add the middleware to the server entry file
        },
      },
      {
        title: 'Prettifying the server entry file',
        task: async (_ctx, task) => {
          try {
            const source = fs.readFileSync(rwPaths.web.entryServer, 'utf-8')
            const prettierOptions = await getPrettierOptions()
            const prettifiedApp = await format(source, {
              ...prettierOptions,
              parser: 'babel-ts',
            })
            fs.writeFileSync(rwPaths.web.entryServer, prettifiedApp, 'utf-8')
          } catch (error) {
            task.output = "Couldn't prettify the server entry file"
          }
        },
      },
      {
        task: () => {
          printTaskEpilogue(command, description, EXPERIMENTAL_TOPIC_ID)
        },
      },
    ],
    {
      rendererOptions: { collapseSubtasks: false, persistentOutput: true },
      renderer: verbose ? 'verbose' : 'default',
    },
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
