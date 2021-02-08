import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

const MODEL = `model RW_DataMigration {
  version    String   @id
  name       String
  startedAt  DateTime
  finishedAt DateTime
}`

const POST_INSTALL_INSTRUCTIONS = `${c.warning(
  "Don't forget to apply your migration when ready:"
)}

    yarn rw dataMigrate up
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
  return await execa('yarn rw', ['db save', 'create data migrations'], {
    cwd: getPaths().base,
    shell: true,
  })
}

export const command = 'install'
export const description = 'Add the RW_DataMigration model to your schema'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#datMigrate-install'
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
    { collapse: false, exitOnError: true }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
