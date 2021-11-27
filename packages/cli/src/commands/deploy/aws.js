import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'
import c from '../../lib/colors'

import { pack } from './aws-providers/packing'

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
    .option('side', {
      describe: 'which Side(s) to deploy',
      choices: ['api'],
      default: 'api',
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

export const handler = async ({ provider, verbose, stage }) => {
  const BASE_DIR = getPaths().base
  const providerData = await import(`./aws-providers/${provider}`)

  const tasks = new Listr(
    [
      providerData.preRequisites &&
        providerData.preRequisites.length > 0 && {
          title: 'Checking pre-requisites',
          task: () =>
            new Listr(
              providerData.preRequisites.map((preReq) => {
                return {
                  title: preReq.title,
                  task: async () => {
                    try {
                      await execa(...preReq.command)
                    } catch (error) {
                      error.message =
                        error.message + '\n' + preReq.errorMessage.join(' ')
                      throw error
                    }
                  },
                }
              })
            ),
        },
      {
        title: 'Building and Packaging...',
        task: () =>
          new Listr(
            [
              {
                title: providerData.buildCommands[0].title,
                task: async () => {
                  await execa(...providerData.buildCommands[0].command, {
                    cwd: BASE_DIR,
                  })
                },
              },
              {
                title: 'packing',
                task: pack,
              },
            ],
            { collapse: false }
          ),
      },
    ].filter(Boolean),
    { collapse: false, renderer: verbose && VerboseRenderer }
  )

  try {
    await tasks.run()

    console.log(c.green(providerData.deployCommand.title))
    const deployCommand = [...providerData.deployCommand.command]
    deployCommand[1] = [...deployCommand[1], '--stage', stage]
    const deploy = execa(...deployCommand, {
      cwd: BASE_DIR,
    })
    deploy.stdout.pipe(process.stdout)
    await deploy
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
