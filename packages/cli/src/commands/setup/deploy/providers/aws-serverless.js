// import terminalLink from 'terminal-link'
import fs from 'fs'
import path from 'path'

import Listr from 'listr'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  addToGitIgnoreTask,
  addFilesTask,
  addPackagesTask,
  printSetupNotes,
} from '../helpers'
import { SERVERLESS_YML } from '../templates/serverless'

export const command = 'aws-serverless'
export const description = 'Setup deploy to AWS, via the Serverless framework'

export const notes = [
  'You are ready to deploy to AWS using the Serverless framework!',
  'To configure AWS credentials, see https://www.serverless.com/framework/docs/providers/aws/guide/credentials/',
  'For a more detailed way to configure the credentials using the AWS CLI, see https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html',
  'To deploy, see https://redwoodjs.com/docs/deploy#aws_serverless',
]

const projectDevPackages = [
  'serverless',
  'serverless-dotenv-plugin',
  '@vercel/nft',
  'archiver',
  'fs-extra',
]

const files = [
  {
    path: path.join(getPaths().base, 'serverless.yml'),
    content: SERVERLESS_YML,
  },
]

const prismaBinaryTargetAdditions = () => {
  const content = fs.readFileSync(getPaths().api.dbSchema).toString()

  if (!content.includes('rhel-openssl-1.0.x')) {
    const result = content.replace(
      /binaryTargets =.*\n/,
      `binaryTargets = ["native", "rhel-openssl-1.0.x"]\n`
    )

    fs.writeFileSync(getPaths().api.dbSchema, result)
  }
}

export const handler = async ({ force }) => {
  const tasks = new Listr(
    [
      addPackagesTask({
        packages: projectDevPackages,
        devDependency: true,
      }),
      addFilesTask({
        files,
        force,
      }),
      addToGitIgnoreTask({
        paths: ['.serverless'],
      }),
      {
        title: 'Adding necessary Prisma binaries...',
        task: () => prismaBinaryTargetAdditions(),
      },
      printSetupNotes(notes),
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
