export const preRequisites = [
  {
    title: 'Checking if Serverless framework is installed...',
    command: ['serverless', ['--version']],
    errorMessage: [
      'Looks like Serverless is not installed.',
      'Please follow the steps at https://www.serverless.com/framework/docs/providers/aws/guide/installation/ to install Serverless.',
    ],
  },
]

export const buildCommands = [
  { title: 'Building API...', command: ['yarn', ['rw', 'build', 'api']] },
]

export const deployCommand = {
  title: 'Deploying...',
  command: ['serverless', ['deploy']],
}
