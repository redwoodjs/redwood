import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import { Listr } from 'listr2'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../lib'
import c from '../../lib/colors'

const MODEL = `model RW_DataMigration {
  version    String   @id
  name       String
  startedAt  DateTime
  finishedAt DateTime
}`

const POST_INSTALL_INSTRUCTIONS = `${c.warning(
  "Don't forget to apply your migration when ready:"
)}

    ${c.bold('yarn rw prisma migrate dev')}
`

// Creates dataMigrations directory
const createPath = () => {
  return fs.outputFileSync(
    path.join(getPaths().api.dataMigrations, '.keep'),
    ''
  )
}

// Appends RW_DataMigration model to schema.prisma
const appendModel = () => {
  const schemaPath = getPaths().api.dbSchema
  const schema = fs.readFileSync(schemaPath).toString()
  const newSchema = `${schema}\n${MODEL}\n`

  return fs.writeFileSync(schemaPath, newSchema)
}

// Create a new migration
const save = async () => {
  return await execa(
    'yarn rw',
    ['prisma migrate dev', '--name create_data_migrations', '--create-only'],
    {
      cwd: getPaths().api.base,
      shell: true,
    }
  )
}

export const command = 'install'
export const description = 'Add the RW_DataMigration model to your schema'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#install'
    )}`
  )
}

export const handler = async () => {
  const tasks = new Listr(
    [
      {
        title: `Creating dataMigrations directory...`,
        task: createPath,
      },
      {
        title: 'Adding RW_DataMigration model to schema.prisma...',
        task: await appendModel,
      },
      {
        title: 'Create db migration...',
        task: await save,
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `Next steps:\n   ${POST_INSTALL_INSTRUCTIONS}`
        },
      },
    ],
    { rendererOptions: { collapse: false }, exitOnError: true }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
