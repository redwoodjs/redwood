import path from 'path'
import fs from 'fs'

import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

const MODEL = `model DataMigration {
  version    String   @id
  name       String
  startedAt  DateTime
  finishedAt DateTime
}`

const POST_INSTALL_INSTRUCTIONS = `${c.warning(
  "Don't forget to apply your migration when ready:"
)}

     yarn rw db up
`

// Creates dataMigrations directory
const createPath = () => {
  return fs.closeSync(
    fs.openSync(path.join(getPaths().api.db, 'dataMigrations', '.keep'), 'w')
  )
}

// Appends _DataMigration model to schema.prisma
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
export const description = 'Add the DataMigration model to your schema'
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
        title: 'Adding DataMigration model to schema.prisma...',
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
