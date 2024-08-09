// Implements a job adapter using Prisma ORM. Assumes a table exists with the
// following schema (the table name can be customized):
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

import type { PrismaClient } from '@prisma/client'
import { camelCase } from 'change-case'

import { DEFAULT_MAX_RUNTIME, DEFAULT_MODEL_NAME } from '../consts'
import { ModelNameError } from '../errors'

import type {
  BaseJob,
  BaseAdapterOptions,
  FindArgs,
  SchedulePayload,
} from './BaseAdapter'
import { BaseAdapter } from './BaseAdapter'

interface PrismaJob extends BaseJob {
  id: number
  handler: string
  runAt: Date
  lockedAt: Date
  lockedBy: string
  lastError: string | null
  failedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface PrismaAdapterOptions extends BaseAdapterOptions {
  /**
   * An instance of PrismaClient which will be used to talk to the database
   */
  db: PrismaClient
  /**
   * The name of the model in the Prisma schema that represents the job table.
   * @default 'BackgroundJob'
   */
  model?: string
}

interface SuccessData {
  lockedAt: null
  lockedBy: null
  lastError: null
  runAt: null
}

interface FailureData {
  lockedAt: null
  lockedBy: null
  lastError: string
  failedAt?: Date
  runAt: Date | null
}

export class PrismaAdapter extends BaseAdapter<PrismaAdapterOptions> {
  db: PrismaClient
  model: string
  accessor: PrismaClient[keyof PrismaClient]
  provider: string

  constructor(options: PrismaAdapterOptions) {
    super(options)

    this.db = options.db

    // name of the model as defined in schema.prisma
    this.model = options.model || DEFAULT_MODEL_NAME

    // the function to call on `db` to make queries: `db.backgroundJob`
    this.accessor = this.db[camelCase(this.model)]

    // the database provider type: 'sqlite' | 'postgresql' | 'mysql'
    // not used currently, but may be useful in the future for optimizations
    this.provider = options.db._activeProvider

    // validate that everything we need is available
    if (!this.accessor) {
      throw new ModelNameError(this.model)
    }
  }

  // Finds the next job to run, locking it so that no other process can pick it
  // The act of locking a job is dependant on the DB server, so we'll run some
  // raw SQL to do it in each case—Prisma doesn't provide enough flexibility
  // in their generated code to do this in a DB-agnostic way.
  //
  // TODO: there may be more optimized versions of the locking queries in
  // Postgres and MySQL
  override async find({
    processName,
    maxRuntime,
    queues,
  }: FindArgs): Promise<PrismaJob | null> {
    const maxRuntimeExpire = new Date(
      new Date().getTime() + (maxRuntime || DEFAULT_MAX_RUNTIME * 1000),
    )

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

    // If queues is ['*'] then skip, otherwise add a WHERE...IN for the array of
    // queue names
    const whereWithQueue = where
    if (queues.length > 1 || queues[0] !== '*') {
      Object.assign(whereWithQueue, {
        AND: [...where.AND, { queue: { in: queues } }],
      })
    }

    // Actually query the DB
    const job = await this.accessor.findFirst({
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

      // Update and increment the attempts count
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
        const data = await this.accessor.findFirst({ where: { id: job.id } })
        const { name, path, args } = JSON.parse(data.handler)
        return { ...data, name, path, args }
      }
    }

    // If we get here then there were either no jobs, or the one we found
    // was locked by another worker
    return null
  }

  // Prisma queries are lazily evaluated and only sent to the db when they are
  // awaited, so do the await here to ensure they actually run. Otherwise the
  // user must always await `performLater()` or the job won't actually be
  // scheduled.
  override success({ job, deleteJob }: { job: PrismaJob; deleteJob: boolean }) {
    this.logger.debug(`Job ${job.id} success`)

    if (deleteJob) {
      this.accessor.delete({ where: { id: job.id } })
    } else {
      this.accessor.update({
        where: { id: job.id },
        data: {
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          runAt: null,
        },
      })
    }
  }

  override error({ job, error }: { job: PrismaJob; error: Error }) {
    this.logger.debug(`Job ${job.id} failure`)

    const data: FailureData = {
      lockedAt: null,
      lockedBy: null,
      lastError: `${error.message}\n\n${error.stack}`,
      runAt: null,
    }

    data.runAt = new Date(
      new Date().getTime() + this.backoffMilliseconds(job.attempts),
    )

    this.accessor.update({
      where: { id: job.id },
      data,
    })
  }

  // Job has had too many attempts, it is not permanently failed.
  override failure({ job, deleteJob }: { job: PrismaJob; deleteJob: boolean }) {
    if (deleteJob) {
      this.accessor.delete({ where: { id: job.id } })
    } else {
      this.accessor.update({
        where: { id: job.id },
        data: { failedAt: new Date() },
      })
    }
  }

  // Schedules a job by creating a new record in the background job table
  override schedule({ job, args, runAt, queue, priority }: SchedulePayload) {
    this.accessor.create({
      data: {
        handler: JSON.stringify({ job, args }),
        runAt,
        queue,
        priority,
      },
    })
  }

  override clear() {
    this.accessor.deleteMany()
  }

  backoffMilliseconds(attempts: number) {
    return 1000 * attempts ** 4
  }
}