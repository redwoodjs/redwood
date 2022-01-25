import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../lib'
import c from '../../lib/colors'

export const command = 'aws [provider]'
export const description = 'Deploy to AWS using the selected provider'
export const builder = (yargs) => {
  const SUPPORTED_PROVIDERS = fs
    .readdirSync(path.resolve(__dirname, 'aws-providers'))
    .map((file) => path.basename(file, '.js'))
    .filter((file) => file !== 'README.md')

  yargs
    .positional('provider', {
      choices: SUPPORTED_PROVIDERS,
      default: 'serverless',
      description: 'AWS Deploy provider to configure',
      type: 'string',
    })
    .option('sides', {
      describe: 'which Side(s) to deploy',
      choices: ['api', 'web'],
      default: ['api', 'web'],
      alias: 'side',
      type: 'array',
    })
    .option('verbose', {
      describe: 'verbosity of logs',
      default: true,
      type: 'boolean',
    })
    .option('stage', {
      describe:
        'serverless stage pass through param: https://www.serverless.com/blog/stages-and-environments',
      default: 'dev',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )
}

export const handler = async (yargs) => {
  const { provider, verbose } = yargs
  const BASE_DIR = getPaths().base
  const providerData = await import(`./aws-providers/${provider}`)

  const mapCommandsToListr = ({
    title,
    command,
    task,
    cwd,
    errorMessage,
    skip,
    enabled,
  }) => {
    return {
      title: title,
      task: task
        ? task
        : async () => {
            try {
              const executingCommand = execa(...command, {
                cwd: cwd || BASE_DIR,
              })
              executingCommand.stdout.pipe(process.stdout)
              await executingCommand
            } catch (error) {
              if (errorMessage) {
                error.message = error.message + '\n' + errorMessage.join(' ')
              }
              throw error
            }
          },
      skip,
      enabled,
    }
  }

  const tasks = new Listr(
    [
      providerData.preRequisites &&
        providerData.preRequisites.length > 0 && {
          title: 'Checking pre-requisites',
          task: () =>
            new Listr(
              providerData.preRequisites(yargs).map(mapCommandsToListr)
            ),
        },
      {
        title: 'Building and Packaging...',
        task: () =>
          new Listr(providerData.buildCommands(yargs).map(mapCommandsToListr), {
            collapse: false,
          }),
      },
      {
        title: 'Deploying to AWS',
        task: () =>
          new Listr(providerData.deployCommands(yargs).map(mapCommandsToListr)),
      },
    ].filter(Boolean),
    { collapse: false, renderer: verbose && VerboseRenderer }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.log(c.error(e.message))
    process.exit(1)
  }
}
