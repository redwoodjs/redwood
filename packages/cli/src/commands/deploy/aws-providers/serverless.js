export const preRequisites = [
  {
    title: 'Checking if Serverless framework is installed...',
    command: ['serverless', ['--version']],
    errorMessage: [
      'Looks like Serverless is not installed.',
      'Please follow the steps at https://www.serverless.com/framework/docs/providers/aws/guide/installation/ to install Serverless.',
    ],
  },
  {
    title: 'Checking if @netlify/zip-it-and-ship-it is installed...',
    command: ['yarn', ['zip-it-and-ship-it', '--version']],
    errorMessage: [
      'Looks like @netlify/zip-it-and-ship-it is not installed.',
      'Either run `yarn rw setup aws-serverless` or add it separately as a dev dependency in the api workspace.',
    ],
  },
]

export const buildCommands = [
  { title: 'Building API...', command: ['yarn', ['rw', 'build', 'api']] },
  {
    title: 'Packaging API...',
    command: [
      'yarn',
      ['zip-it-and-ship-it', 'api/dist/functions/', 'api/dist/zipball'],
    ],
  },
]

export const deployCommand = {
  title: 'Deploying...',
  command: ['serverless', ['deploy']],
}
