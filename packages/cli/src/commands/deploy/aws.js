import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'

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
    .option('side', {
      describe: 'which Side(s) to deploy',
      choices: ['api'],
      default: 'api',
      type: 'array',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )
}

export const handler = async ({ provider }) => {
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
            providerData.buildCommands.map((commandDetail) => {
              return {
                title: commandDetail.title,
                task: async () => {
                  await execa(...commandDetail.command, {
                    cwd: BASE_DIR,
                  })
                },
              }
            }),
            { collapse: false }
          ),
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()

    console.log(c.green(providerData.deployCommand.title))
    const deploy = execa(...providerData.deployCommand.command, {
      cwd: BASE_DIR,
    })
    deploy.stdout.pipe(process.stdout)
    await deploy
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
