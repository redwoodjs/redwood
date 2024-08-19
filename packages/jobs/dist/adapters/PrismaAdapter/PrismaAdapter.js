"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var PrismaAdapter_exports = {};
__export(PrismaAdapter_exports, {
  PrismaAdapter: () => PrismaAdapter
});
module.exports = __toCommonJS(PrismaAdapter_exports);
var import_change_case = require("change-case");
var import_consts = require("../../consts");
var import_BaseAdapter = require("../BaseAdapter/BaseAdapter");
var import_errors = require("./errors");
class PrismaAdapter extends import_BaseAdapter.BaseAdapter {
  db;
  model;
  accessor;
  provider;
  constructor(options) {
    super(options);
    this.db = options.db;
    this.model = options.model || import_consts.DEFAULT_MODEL_NAME;
    this.accessor = this.db[(0, import_change_case.camelCase)(this.model)];
    this.provider = options.db._activeProvider;
    if (!this.accessor) {
      throw new import_errors.ModelNameError(this.model);
    }
  }
  /**
   * Finds the next job to run, locking it so that no other process can pick it
   * The act of locking a job is dependant on the DB server, so we'll run some
   * raw SQL to do it in each case—Prisma doesn't provide enough flexibility
   * in their generated code to do this in a DB-agnostic way.
   *
   * TODO: there may be more optimized versions of the locking queries in
   * Postgres and MySQL
   */
  async find({
    processName,
    maxRuntime,
    queues
  }) {
    const maxRuntimeExpire = new Date(
      (/* @__PURE__ */ new Date()).getTime() + (maxRuntime || import_consts.DEFAULT_MAX_RUNTIME * 1e3)
    );
    const where = {
      AND: [
        {
          OR: [
            {
              AND: [
                { runAt: { lte: /* @__PURE__ */ new Date() } },
                {
                  OR: [
                    { lockedAt: null },
                    {
                      lockedAt: {
                        lt: maxRuntimeExpire
                      }
                    }
                  ]
                }
              ]
            },
            { lockedBy: processName }
          ]
        },
        { failedAt: null }
      ]
    };
    const whereWithQueue = where;
    if (queues.length > 1 || queues[0] !== "*") {
      Object.assign(whereWithQueue, {
        AND: [...where.AND, { queue: { in: queues } }]
      });
    }
    const job = await this.accessor.findFirst({
      select: { id: true, attempts: true },
      where: whereWithQueue,
      orderBy: [{ priority: "asc" }, { runAt: "asc" }],
      take: 1
    });
    if (job) {
      const whereWithQueueAndId = Object.assign(whereWithQueue, {
        AND: [...whereWithQueue.AND, { id: job.id }]
      });
      const { count } = await this.accessor.updateMany({
        where: whereWithQueueAndId,
        data: {
          lockedAt: /* @__PURE__ */ new Date(),
          lockedBy: processName,
          attempts: job.attempts + 1
        }
      });
      if (count) {
        const data = await this.accessor.findFirst({ where: { id: job.id } });
        const { name, path, args } = JSON.parse(data.handler);
        return { ...data, name, path, args };
      }
    }
    return void 0;
  }
  // Prisma queries are lazily evaluated and only sent to the db when they are
  // awaited, so do the await here to ensure they actually run (if the user
  // doesn't await the Promise then the queries will never be executed!)
  async success({ job, deleteJob }) {
    this.logger.debug(`[RedwoodJob] Job ${job.id} success`);
    if (deleteJob) {
      await this.accessor.delete({ where: { id: job.id } });
    } else {
      await this.accessor.update({
        where: { id: job.id },
        data: {
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          runAt: null
        }
      });
    }
  }
  async error({ job, error }) {
    this.logger.debug(`[RedwoodJob] Job ${job.id} failure`);
    const data = {
      lockedAt: null,
      lockedBy: null,
      lastError: `${error.message}

${error.stack}`,
      runAt: null
    };
    data.runAt = new Date(
      (/* @__PURE__ */ new Date()).getTime() + this.backoffMilliseconds(job.attempts)
    );
    await this.accessor.update({
      where: { id: job.id },
      data
    });
  }
  // Job has had too many attempts, it has now permanently failed.
  async failure({ job, deleteJob }) {
    if (deleteJob) {
      await this.accessor.delete({ where: { id: job.id } });
    } else {
      await this.accessor.update({
        where: { id: job.id },
        data: { failedAt: /* @__PURE__ */ new Date() }
      });
    }
  }
  // Schedules a job by creating a new record in the background job table
  async schedule({
    name,
    path,
    args,
    runAt,
    queue,
    priority
  }) {
    await this.accessor.create({
      data: {
        handler: JSON.stringify({ name, path, args }),
        runAt,
        queue,
        priority
      }
    });
  }
  async clear() {
    await this.accessor.deleteMany();
  }
  backoffMilliseconds(attempts) {
    return 1e3 * attempts ** 4;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PrismaAdapter
});
