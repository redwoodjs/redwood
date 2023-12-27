import fs from 'fs-extra'
import { Listr } from 'listr2'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { addPackagesTask, getPaths, printSetupNotes } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  ERR_MESSAGE_MISSING_CLI,
  ERR_MESSAGE_NOT_INITIALIZED,
} from '../../../deploy/edgio'
import { preRequisiteCheckTask } from '../helpers'

export const command = 'edgio'
export const description = 'Setup Edgio deploy'

const notes = [
  'You are almost ready to deploy to Edgio!',
  '',
  'See https://redwoodjs.com/docs/deploy#edgio-deploy for the remaining',
  'config and setup required before you can perform your first deploy.',
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

export const handler = async () => {
  recordTelemetryAttributes({
    command: 'setup deploy edgio',
  })
  const tasks = new Listr(
    [
      addPackagesTask({
        packages: ['@edgio/cli'],
        devDependency: true,
      }),
      preRequisiteCheckTask([
        {
          title: 'Checking if Edgio is installed...',
          command: ['yarn', ['edgio', '--version']],
          errorMessage: ERR_MESSAGE_MISSING_CLI,
        },
        {
          title: 'Initializing with Edgio',
          command: ['yarn', ['edgio', 'init']],
          errorMessage: ERR_MESSAGE_NOT_INITIALIZED,
        },
      ]),
      {
        title: 'Adding necessary Prisma binaries...',
        task: () => prismaBinaryTargetAdditions(),
      },
      printSetupNotes(notes),
    ],
    { rendererOptions: { collapseSubtasks: false } }
  )
  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
