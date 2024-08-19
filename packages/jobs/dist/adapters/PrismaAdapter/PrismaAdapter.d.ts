import type { PrismaClient } from '@prisma/client';
import type { BaseJob } from '../../types';
import type { BaseAdapterOptions, SchedulePayload, FindArgs, SuccessOptions, ErrorOptions, FailureOptions } from '../BaseAdapter/BaseAdapter';
import { BaseAdapter } from '../BaseAdapter/BaseAdapter';
export interface PrismaJob extends BaseJob {
    id: number;
    handler: string;
    runAt: Date;
    lockedAt: Date;
    lockedBy: string;
    lastError: string | null;
    failedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface PrismaAdapterOptions extends BaseAdapterOptions {
    /**
     * An instance of PrismaClient which will be used to talk to the database
     */
    db: PrismaClient;
    /**
     * The name of the model in the Prisma schema that represents the job table.
     * @default 'BackgroundJob'
     */
    model?: string;
}
/**
 * Implements a job adapter using Prisma ORM.
 *
 * Assumes a table exists with the following schema (the table name can be customized):
 * ```prisma
 * model BackgroundJob {
 *   id        Int       \@id \@default(autoincrement())
 *   attempts  Int       \@default(0)
 *   handler   String
 *   queue     String
 *   priority  Int
 *   runAt     DateTime
 *   lockedAt  DateTime?
 *   lockedBy  String?
 *   lastError String?
 *   failedAt  DateTime?
 *   createdAt DateTime  \@default(now())
 *   updatedAt DateTime  \@updatedAt
 * }
 * ```
 */
export declare class PrismaAdapter extends BaseAdapter<PrismaAdapterOptions> {
    db: PrismaClient;
    model: string;
    accessor: PrismaClient[keyof PrismaClient];
    provider: string;
    constructor(options: PrismaAdapterOptions);
    /**
     * Finds the next job to run, locking it so that no other process can pick it
     * The act of locking a job is dependant on the DB server, so we'll run some
     * raw SQL to do it in each case—Prisma doesn't provide enough flexibility
     * in their generated code to do this in a DB-agnostic way.
     *
     * TODO: there may be more optimized versions of the locking queries in
     * Postgres and MySQL
     */
    find({ processName, maxRuntime, queues, }: FindArgs): Promise<PrismaJob | undefined>;
    success({ job, deleteJob }: SuccessOptions<PrismaJob>): Promise<void>;
    error({ job, error }: ErrorOptions<PrismaJob>): Promise<void>;
    failure({ job, deleteJob }: FailureOptions<PrismaJob>): Promise<void>;
    schedule({ name, path, args, runAt, queue, priority, }: SchedulePayload): Promise<void>;
    clear(): Promise<void>;
    backoffMilliseconds(attempts: number): number;
}
//# sourceMappingURL=PrismaAdapter.d.ts.map