import ntfPack from '../packing/nft'

export const preRequisites = () => [
  {
    title: 'Checking if Serverless framework is installed...',
    command: ['serverless', ['--version']],
    errorMessage: [
      'Looks like Serverless is not installed.',
      'Please follow the steps at https://www.serverless.com/framework/docs/getting-started to install Serverless.',
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
      command: ['serverless', ['deploy', ...stage]],
    },
  ]
}
