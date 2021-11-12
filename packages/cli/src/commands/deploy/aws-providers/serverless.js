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
    title: 'Checking if @vercel/nft is installed...',
    command: ['yarn', ['nft', '--version']],
    errorMessage: [
      'Looks like @vercel/nft is not installed.',
      'Either run `yarn rw setup aws-serverless` or add it seperately as a dev dependency in the api workspace.',
    ],
  },
]

export const buildCommands = [
  { title: 'Building API...', command: ['yarn', ['rw', 'build', 'api']] },
  // TODO figure out how to package individual functions
  // {
  //   title: 'Packaging API...',
  //   command: ['yarn', ['nft', 'build', 'api/dist/functions/*.js']],
  // },
  // {
  //   title: 'Zipping API...',
  //   command: ['zip', '-r', 'api/dist/zipball/fixme.zip', 'dist'],
  // },
]

export const deployCommand = {
  title: 'Deploying...',
  command: ['serverless', ['deploy']],
}
