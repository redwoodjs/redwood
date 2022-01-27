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

export const buildCommands = () => [
  {
    title: 'Building Web And API...',
    command: ['yarn', ['rw', 'build']],
  },
  {
    title: 'Packing Functions...',
    task: ntfPack,
  },
]

export const deployCommands = (yargs) => {
  const stage = yargs.stage ? ['--stage', yargs.stage] : []
  return [
    {
      title: 'Deploying...',
      command: ['yarn', ['serverless', 'deploy', ...stage]],
    },
  ]
}
