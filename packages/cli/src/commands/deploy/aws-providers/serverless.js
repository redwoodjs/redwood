import fs from 'fs'
import path from 'path'

import { config } from 'dotenv-defaults'
import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import prompts from 'prompts'

import { getPaths } from '../../../lib'
import c from '../../../lib/colors'
import ntfPack from '../packing/nft'

export const command = 'serverless'
export const description = 'Deploy to AWS via the serverless framework'

export const builder = (yargs) => {
  yargs.option('stage', {
    describe:
      'serverless stage pass through param: https://www.serverless.com/blog/stages-and-environments',
    default: 'staging',
    type: 'string',
  })

  yargs.option('pack-only', {
    describe: 'Only build and pack, and dont push code up using serverless',
    default: false,
    type: 'boolean',
  })

  yargs.option('first-run', {
    describe:
      'Set this flag the first time you deploy, to configure your API URL on the webside',
    default: false,
    type: 'boolean',
  })
}

export const preRequisites = () => [
  {
    title: 'Checking if Serverless framework is installed...',
    command: ['yarn serverless', ['--version']],
    errorMessage: [
      'Looks like Serverless is not installed.',
      'Please run yarn add -W --dev serverless.',
    ],
  },
]

export const buildCommands = ({ side: sides }) => [
  {
    title: `Building ${sides.join(' & ')}...`,
    command: ['yarn', ['rw', 'build', ...sides]],
  },
  {
    title: 'Packing Functions...',
    enabled: () => sides.includes('api'),
    task: ntfPack,
  },
]

export const deployCommands = ({ stage, sides, firstRun, packOnly }) => {
  const slsStage = stage ? ['--stage', stage] : []

  return sides.map((side) => {
    return {
      title: `Deploying ${side}....`,
      command: ['yarn', ['serverless', 'deploy', ...slsStage]],
      cwd: path.join(getPaths().base, side),
      skip: () => {
        if (firstRun && side === 'web') {
          return 'Skipping web deploy, until environment configured'
        }

        if (packOnly) {
          return 'Finishing early due to --pack-only flag. Your Redwood project is packaged and ready to deploy'
        }
      },
    }
  })
}

export const handler = async (yargs) => {
  const rwjsPaths = getPaths()
  const dotEnvPath = path.join(rwjsPaths.base, `.env.${yargs.stage}`)

  // Make sure we use the correct .env based on the stage
  config({
    path: dotEnvPath,
    defaults: path.join(getPaths().base, '.env.defaults'),
    encoding: 'utf8',
  })

  const tasks = new Listr(
    [
      ...preRequisites(yargs).map(mapCommandsToListr),
      ...buildCommands(yargs).map(mapCommandsToListr),
      ...deployCommands(yargs).map(mapCommandsToListr),
    ],
    {
      exitOnError: true,
      renderer: yargs.verbose && VerboseRenderer,
    }
  )
  try {
    await tasks.run()

    if (yargs.firstRun) {
      const { stdout: slsInfo } = await execa(
        'yarn serverless info --verbose',
        {
          shell: true,
          cwd: getPaths().api.base,
        }
      )

      const deployedApiUrl = slsInfo.match(/HttpApiUrl: (https:\/\/.*)/)[1]

      console.log()
      console.log(`Found ${c.green(deployedApiUrl)}`)
      const { addDotEnv } = await prompts({
        type: 'confirm',
        name: 'addDotEnv',
        message: `Add API_URL to your .env.${yargs.stage}? This will be used when you build your web side`,
      })

      if (addDotEnv) {
        fs.writeFileSync(dotEnvPath, `API_URL=${deployedApiUrl}`)
      }

      if (yargs.sides.includes('web')) {
        console.log('---- Deploying web side with updated url ----')

        console.log('First deploys can take a good few minutes..')

        const webDeployTasks = new Listr([
          ...buildCommands({ ...yargs, sides: ['web'], firstRun: false }).map(
            mapCommandsToListr
          ),
          ...deployCommands({ ...yargs, sides: ['web'], firstRun: false }).map(
            mapCommandsToListr
          ),
        ])

        // Deploy the web side now that the API_URL has been configured
        await webDeployTasks.run()
      }
    }
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}

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
    title,
    task: task
      ? task
      : async () => {
          try {
            const executingCommand = execa(...command, {
              cwd: cwd || getPaths().base,
              shell: true,
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
