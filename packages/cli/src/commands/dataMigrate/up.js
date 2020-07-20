import path from 'path'
import fs from 'fs'

import Listr from 'listr'
import terminalLink from 'terminal-link'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths, asyncForEach } from 'src/lib'
import c from 'src/lib/colors'

require('@babel/register')
const { db } = require(path.join(getPaths().api.lib, 'db'))

// const { db } = await import(path.join(getPaths().api.lib, 'db'))

// Return the list of migrations that haven't run against the database yet
const getMigrations = async () => {
  const basePath = path.join(getPaths().api.db, 'dataMigrations')

  // gets all migrations present in the app
  const files = fs
    .readdirSync(basePath)
    .filter((m) => path.extname(m) === '.js')
    .map((m) => {
      return {
        [m.split('-')[0]]: path.join(basePath, m),
      }
    })

  // gets all migration versions that have already run against the database
  const ranMigrations = await db.dataMigration.findMany({
    orderBy: { version: 'asc' },
  })
  const ranVersions = ranMigrations.map((migration) =>
    migration.version.toString()
  )

  const unrunMigrations = files.filter((migration) => {
    return !ranVersions.includes(Object.keys(migration)[0])
  })

  return unrunMigrations
}

const recordMigration = async (version, name, startedAt, finishedAt) => {
  console.info(`Recording ${version}`)
  await db.dataMigration.create({
    data: { version, name, startedAt, finishedAt },
  })
  return true
}

export const command = 'up'
export const description =
  'Run any outstanding Data Migrations against the database'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#datMigrate-up'
    )}`
  )
}

export const handler = async () => {
  const migrations = await getMigrations()
  const migrationTasks = migrations.map((migration) => {
    const version = Object.keys(migration)[0]
    const migrationPath = Object.values(migration)[0]
    const migrationName = path.basename(migrationPath, '.js')

    return {
      title: migrationName,
      task: async (_ctx, task) => {
        const script = await import(migrationPath)
        const startedAt = new Date()
        await script.default({ db })
        const finishedAt = new Date()
        await recordMigration(version, migrationName, startedAt, finishedAt)
      },
    }
  })

  if (!migrationTasks.length) {
    console.info('\n  Data migrations up-to-date.\n')
    process.exit(0)
  }

  const tasks = new Listr(migrationTasks, {
    collapse: false,
    renderer: VerboseRenderer,
  })

  try {
    await tasks.run()
    process.exit(0)
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
