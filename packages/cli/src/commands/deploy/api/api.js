import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'api <provider>'
export const description = 'Deploy the API using the selected provider'
export const builder = (yargs) => {
  const SUPPORTED_PROVIDERS = fs
    .readdirSync(path.resolve(__dirname, 'providers'))
    .map((file) => path.basename(file, '.js'))
    .filter((file) => file !== 'README.md')

  yargs
    .positional('provider', {
      choices: SUPPORTED_PROVIDERS,
      description: 'API Deploy provider to configure',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#deploy-api'
      )}`
    )
}

export const handler = async ({ provider }) => {
  const BASE_DIR = getPaths().base
  const providerData = await import(`./providers/${provider}`)

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
