import fs from 'fs'

import { getPaths } from 'src/lib'

export const preRequisites = [
  {
    title: 'Checking if serverless is installed...',
    command: ['serverless', ['--version']],
    errorMessage: [
      'Looks like serverless is not installed.',
      'Please follow the steps at https://www.serverless.com/framework/docs/providers/aws/guide/installation/ to install serverless.',
    ],
  },
  {
    title: 'Checking if @netlify/zip-it-and-ship-it is installed...',
    command: ['yarn', ['zip-it-and-ship-it', '--version']],
    errorMessage: [
      'Looks like @netlify/zip-it-and-ship-it is not installed.',
      'Either run `yarn rw g deploy aws_serverless` or add it seperately as a dev dependency in the api workspace.',
    ],
  },
  {
    title:
      'Checking if rhel-openssl-1.0.x is a binary target in prisma schema...',
    jsFunction: () => {
      let content = fs.readFileSync(getPaths().api.dbSchema).toString()
      if (!content.includes('rhel-openssl-1.0.x')) {
        throw new Error(
          'rhel-openssl-1.0.x not included in binaryTargets in prisma schema.'
        )
      }
    },
    errorMessage: [
      'Looks like rhel-openssl-1.0.x is not a binary target for the prisma client generator.',
      'Add it to binaryTargets in the generator section of your prisma schema.',
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
