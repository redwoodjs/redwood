import path from 'path'

import { getPaths } from '@redwoodjs/internal'

import ntfPack from '../packing/nft'

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
