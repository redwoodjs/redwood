import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths } from '../../../lib'
import c from '../../../lib/colors'
import ntfPack from '../packing/nft'

export const command = 'serverless'
export const description = 'Deploy to AWS via the serverless framework'

export const builder = (yargs) => {
  yargs.option('stage', {
    describe:
      'serverless stage pass through param: https://www.serverless.com/blog/stages-and-environments',
    default: 'dev',
    type: 'string',
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

export const deployCommands = ({ stage, sides }) => {
  const slsStage = stage ? ['--stage', stage] : []

  return sides.map((side) => {
    return {
      title: `Deploying ${side}....`,
      command: ['yarn', ['serverless', 'deploy', ...slsStage]],
      cwd: path.join(getPaths().base, side),
    }
  })
}

export const handler = async (yargs) => {
  const tasks = new Listr(
    [
      ...preRequisites(yargs).map(mapCommandsToListr),
      ...buildCommands(yargs).map(mapCommandsToListr),
      ...deployCommands(yargs).map(mapCommandsToListr),
    ],
    {
      exitOnError: true,
    }
  )
  try {
    await tasks.run()
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
