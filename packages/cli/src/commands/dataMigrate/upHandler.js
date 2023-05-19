import fs from 'fs'
import path from 'path'

import { Listr } from 'listr2'
import { registerApiSideBabelHook } from 'redwoodjs/internal/dist/build/babel/api'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../lib'
import c from '../../lib/colors'

const redwoodProjectPaths = getPaths()
let requireHookRegistered = false

/**
 * @param {{
 *   strategy: 'requireHook' | 'dist' = 'requireHook'
 * }} options
 */
export async function handler({ strategy }) {
  let db

  switch (strategy) {
    case 'dist': {
      if (!fs.existsSync(redwoodProjectPaths.api.dist)) {
        console.warn(
          `Can't find api dist. You may need to build first: yarn rw build api`
        )
        process.exitCode = 1
        return
      }

      db = await import(path.join(redwoodProjectPaths.api.dist, 'lib', 'db')).db

      break
    }

    case 'requireHook':
    default: {
      registerApiSideBabelHook()
      requireHookRegistered = true

      db = await import(path.join(redwoodProjectPaths.api.dist, 'src', 'db')).db

      break
    }
  }

  const pendingDataMigrations = await getPendingDataMigrations(db)

  if (!pendingDataMigrations.length) {
    console.info(
      c.green('\nNo pending data migrations run, already up-to-date.\n')
    )
    process.exitCode = 0
    return
  }

  const counters = { run: 0, skipped: 0, error: 0 }

  const dataMigrationTasks = pendingDataMigrations.map((dataMigration) => {
    const [version, dataMigrationFilePath] = Object.entries(dataMigration)
    const dataMigrationName = path.basename(dataMigrationFilePath, '.js')

    return {
      title: dataMigrationName,
      skip() {
        if (counters.error > 0) {
          counters.skipped++
          return true
        }
      },
      async task() {
        if (!requireHookRegistered) {
          registerApiSideBabelHook()
        }

        try {
          const { startedAt, finishedAt } = await runDataMigration(
            db,
            dataMigrationFilePath
          )
          counters.run++
          await recordDataMigration(db, {
            version,
            name: dataMigrationName,
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

  const tasks = new Listr(dataMigrationTasks, {
    rendererOptions: { collapseSubtasks: false },
    renderer: 'verbose',
  })

  try {
    await tasks.run()
    await db.$disconnect()

    console.log()
    reportDataMigrations(counters)
    console.log()

    if (counters.error) {
      process.exitCode = 1
    }
  } catch (e) {
    await db.$disconnect()

    console.log()
    reportDataMigrations(counters)
    console.log()

    errorTelemetry(process.argv, e.message)
    process.exitCode = e?.exitCode ?? 1
  }
}

/**
 * Return the list of migrations that haven't run against the database yet
 */
async function getPendingDataMigrations(db) {
  const dataMigrationsPath = redwoodProjectPaths.api.dataMigrations

  const dataMigrationVersionsToFileNames = fs
    .readdirSync(dataMigrationsPath)
    .map((dataMigrationFileName) => {
      const [version] = dataMigrationFileName.split('-')

      return {
        [version]: path.join(dataMigrationsPath, dataMigrationFileName),
      }
    })

  const ranDataMigrations = await db.rW_DataMigration.findMany({
    orderBy: { version: 'asc' },
  })
  const ranDataMigrationVersions = ranDataMigrations.map((dataMigration) =>
    dataMigration.version.toString()
  )

  const pendingDataMigrations = dataMigrationVersionsToFileNames
    .filter(({ version }) => {
      return !ranDataMigrationVersions.includes(version)
    })
    .sort(sortDataMigrationsByVersion)

  return pendingDataMigrations
}

/**
 * Sorts migrations by date, oldest first
 */
function sortDataMigrationsByVersion(dataMigrationA, dataMigrationB) {
  const aVersion = parseInt(dataMigrationA.version)
  const bVersion = parseInt(dataMigrationB.version)

  if (aVersion > bVersion) {
    return 1
  }
  if (aVersion < bVersion) {
    return -1
  }
  return 0
}

async function runDataMigration(db, dataMigrationPath) {
  const dataMigration = await import(dataMigrationPath)

  const startedAt = new Date()
  await dataMigration.default({ db })
  const finishedAt = new Date()

  return { startedAt, finishedAt }
}

/**
 * Adds data for completed migrations to the DB
 */
async function recordDataMigration(
  db,
  { version, name, startedAt, finishedAt }
) {
  await db.rW_DataMigration.create({
    data: { version, name, startedAt, finishedAt },
  })
}

/**
 * Output run status to the console
 */
function reportDataMigrations(counters) {
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
}
