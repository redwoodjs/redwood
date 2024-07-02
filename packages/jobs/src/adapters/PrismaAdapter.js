// Implements a job adapter using Prisma ORM. Assumes a table exists with the
// following schema (the table name and primary key name can be customized):
//
//   model BackgroundJob {
//     id        Int       @id @default(autoincrement())
//     attempts  Int       @default(0)
//     handler   String
//     queue     String
//     priority  Int
//     runAt     DateTime
//     lockedAt  DateTime?
//     lockedBy  String?
//     lastError String?
//     failedAt  DateTime?
//     createdAt DateTime  @default(now())
//     updatedAt DateTime  @updatedAt
//   }
//
// Initialize this adapter passing an `accessor` which is the property on an
// instance of PrismaClient that points to the table thats stores the jobs. In
// the above schema, PrismaClient will create a `backgroundJob` property on
// Redwood's `db` instance:
//
//   import { db } from 'src/lib/db'
//   const adapter = new PrismaAdapter({ accessor: db.backgroundJob })
//   RedwoodJob.config({ adapter })

import { camelCase } from 'change-case'

import { ModelNameError } from '../core/errors'

import { BaseAdapter } from './BaseAdapter'

export const DEFAULT_MODEL_NAME = 'BackgroundJob'
export const DEFAULT_MAX_ATTEMPTS = 24

export class PrismaAdapter extends BaseAdapter {
  constructor(options) {
    super(options)

    // instance of PrismaClient
    this.db = options.db

    // name of the model as defined in schema.prisma
    this.model = options.model || DEFAULT_MODEL_NAME

    // the function to call on `db` to make queries: `db.backgroundJob`
    this.accessor = this.db[camelCase(this.model)]

    // the raw table name in the database
    // if @@map() is used in the schema then the name will be present in
    //   db._runtimeDataModel
    // otherwise it is the same as the model name
    try {
      this.tableName =
        options.tableName ||
        this.db._runtimeDataModel.models[this.model].dbName ||
        this.model
    } catch (e) {
      // model name must not be right because `this.model` wasn't found in
      // `this.db._runtimeDataModel.models`
      if (e.name === 'TypeError' && e.message.match("reading 'dbName'")) {
        throw new ModelNameError(this.model)
      } else {
        throw e
      }
    }

    // the database provider type: 'sqlite' | 'postgresql' | 'mysql'
    this.provider = options.db._activeProvider

    this.maxAttempts = options?.maxAttempts || DEFAULT_MAX_ATTEMPTS
  }

  // Finds the next job to run, locking it so that no other process can pick it
  // The act of locking a job is dependant on the DB server, so we'll run some
  // raw SQL to do it in each case—Prisma doesn't provide enough flexibility
  // in their generated code to do this in a DB-agnostic way.
  // TODO there may be more optimzed versions of the locking queries in Postgres and MySQL, this.options.db._activeProvider returns the provider name
  async find({ processName, maxRuntime, queue }) {
    const maxRuntimeExpire = new Date(new Date() - maxRuntime)

    // This query is gnarly but not so bad once you know what it's doing. For a
    // job to match it must:
    // - have a runtAt in the past
    // - is either not locked, or was locked more than `maxRuntime` ago,
    //   or was already locked by this exact process and never cleaned up
    // - doesn't have a failedAt, meaning we will stop retrying
    // Translates to:
    // `((runAt <= ? AND (lockedAt IS NULL OR lockedAt < ?)) OR lockedBy = ?) AND failedAt IS NULL`
    const where = {
      AND: [
        {
          OR: [
            {
              AND: [
                { runAt: { lte: new Date() } },
                {
                  OR: [
                    { lockedAt: null },
                    {
                      lockedAt: {
                        lt: maxRuntimeExpire,
                      },
                    },
                  ],
                },
              ],
            },
            { lockedBy: processName },
          ],
        },
        { failedAt: null },
      ],
    }

    // for some reason prisma doesn't like it's own `query: { not: null }`
    // syntax, so only add the query condition if we're filtering by queue
    const whereWithQueue = Object.assign(where, {
      AND: [...where.AND, { queue: queue || undefined }],
    })

    // Find the next job that should run now
    let job = await this.accessor.findFirst({
      select: { id: true, attempts: true },
      where: whereWithQueue,
      orderBy: [{ priority: 'asc' }, { runAt: 'asc' }],
      take: 1,
    })

    if (job) {
      // If one was found, try to lock it by updating the record with the
      // same WHERE clause as above (if another locked in the meantime it won't
      // find any record to update)
      const whereWithQueueAndId = Object.assign(whereWithQueue, {
        AND: [...whereWithQueue.AND, { id: job.id }],
      })

      const { count } = await this.accessor.updateMany({
        where: whereWithQueueAndId,
        data: {
          lockedAt: new Date(),
          lockedBy: processName,
          attempts: job.attempts + 1,
        },
      })

      // Assuming the update worked, return the full details of the job
      if (count) {
        return this.accessor.findFirst({ where: { id: job.id } })
      }
    }

    // If we get here then there were either no jobs, or the one we found
    // was locked by another worker
    return null
  }

  success(job) {
    this.logger.debug(`Job ${job.id} success`)
    return this.accessor.delete({ where: { id: job.id } })
  }

  async failure(job, error) {
    this.logger.debug(`Job ${job.id} failure`)
    const data = {
      lockedAt: null,
      lockedBy: null,
      lastError: `${error.message}\n\n${error.stack}`,
    }

    if (job.attempts >= this.maxAttempts) {
      data.failedAt = new Date()
      data.runAt = null
    } else {
      data.runAt = new Date(
        new Date().getTime() + this.backoffMilliseconds(job.attempts),
      )
    }

    return await this.accessor.update({
      where: { id: job.id },
      data,
    })
  }

  // Schedules a job by creating a new record in a `BackgroundJob` table
  // (or whatever the accessor is configured to point to).
  schedule({ handler, args, runAt, queue, priority }) {
    return this.accessor.create({
      data: {
        handler: JSON.stringify({ handler, args }),
        runAt,
        queue,
        priority,
      },
    })
  }

  clear() {
    return this.accessor.deleteMany()
  }

  backoffMilliseconds(attempts) {
    return 1000 * attempts ** 4
  }
}
