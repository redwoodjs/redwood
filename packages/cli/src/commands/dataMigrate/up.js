import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { registerApiSideBabelHook } from '@redwoodjs/internal'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../lib'
import c from '../../lib/colors'

// sorts migrations by date, oldest first
const sortMigrations = (migrations) => {
  return migrations.sort((a, b) => {
    const aVersion = parseInt(Object.keys(a)[0])
    const bVersion = parseInt(Object.keys(b)[0])

    if (aVersion > bVersion) {
      return 1
    }
    if (aVersion < bVersion) {
      return -1
    }
    return 0
  })
}

const SUPPORTED_EXTENSIONS = ['.js', '.ts']

// Return the list of migrations that haven't run against the database yet
const getMigrations = async (db) => {
  const basePath = path.join(getPaths().api.dataMigrations)

  if (!fs.existsSync(basePath)) {
    return []
  }

  // gets all migrations present in the app
  const files = fs
    .readdirSync(basePath)
    .filter((m) => SUPPORTED_EXTENSIONS.includes(path.extname(m)))
    .map((m) => {
      return {
        [m.split('-')[0]]: path.join(basePath, m),
      }
    })

  // gets all migration versions that have already run against the database
  const ranMigrations = await db.rW_DataMigration.findMany({
    orderBy: { version: 'asc' },
  })
  const ranVersions = ranMigrations.map((migration) =>
    migration.version.toString()
  )

  const unrunMigrations = files.filter((migration) => {
    return !ranVersions.includes(Object.keys(migration)[0])
  })

  return sortMigrations(unrunMigrations)
}

// adds data for completed migrations to the DB
const record = async (db, { version, name, startedAt, finishedAt }) => {
  await db.rW_DataMigration.create({
    data: { version, name, startedAt, finishedAt },
  })
}

// output run status to the console
const report = (counters) => {
  console.log('')
  if (counters.run) {
    console.info(
      c.green(`${counters.run} data migration(s) completed successfully.`)
    )
  }
  if (counters.error) {
    console.error(
      c.error(`${counters.error} data migration(s) exited with errors.`)
    )
  }
  if (counters.skipped) {
    console.warn(
      c.warning(
        `${counters.skipped} data migration(s) skipped due to previous error.`
      )
    )
  }
  console.log('')
}

const runScript = async (db, scriptPath) => {
  const script = await import(scriptPath)
  const startedAt = new Date()
  await script.default({ db })
  const finishedAt = new Date()

  return { startedAt, finishedAt }
}

export const command = 'up'
export const description =
  'Run any outstanding Data Migrations against the database'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#datamigrate-up'
    )}`
  )
}

export const handler = async () => {
  // Import babel settings so we can write es6 scripts
  registerApiSideBabelHook()

  const { db } = require(path.join(getPaths().api.lib, 'db'))

  const migrations = await getMigrations(db)

  // exit immediately if there aren't any migrations to run
  if (!migrations.length) {
    console.info(c.green('\nNo data migrations run, already up-to-date.\n'))
    process.exit(0)
  }

  const counters = { run: 0, skipped: 0, error: 0 }
  const migrationTasks = migrations.map((migration) => {
    const version = Object.keys(migration)[0]
    const migrationPath = Object.values(migration)[0]
    const migrationName = path.basename(migrationPath, '.js')

    return {
      title: migrationName,
      skip: () => {
        if (counters.error > 0) {
          counters.skipped++
          return true
        }
      },
      task: async () => {
        try {
          const { startedAt, finishedAt } = await runScript(db, migrationPath)
          counters.run++
          await record(db, {
            version,
            name: migrationName,
            startedAt,
            finishedAt,
          })
        } catch (e) {
          counters.error++
          console.error(c.error(`Error in data migration: ${e.message}`))
        }
      },
    }
  })

  const tasks = new Listr(migrationTasks, {
    collapse: false,
    renderer: VerboseRenderer,
  })

  try {
    await tasks.run()
    await db.$disconnect()
    report(counters)
    if (counters.error) {
      process.exit(1)
    }
  } catch (e) {
    await db.$disconnect()
    report(counters)
    errorTelemetry(process.argv, e.message)
    process.exit(e?.exitCode || 1)
  }
}
