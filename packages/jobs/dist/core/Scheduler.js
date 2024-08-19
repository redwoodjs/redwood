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
var Scheduler_exports = {};
__export(Scheduler_exports, {
  Scheduler: () => Scheduler
});
module.exports = __toCommonJS(Scheduler_exports);
var import_consts = require("../consts");
var import_errors = require("../errors");
class Scheduler {
  adapter;
  logger;
  constructor({ adapter, logger }) {
    this.logger = logger ?? import_consts.DEFAULT_LOGGER;
    this.adapter = adapter;
    if (!this.adapter) {
      throw new import_errors.AdapterNotConfiguredError();
    }
  }
  computeRunAt({ wait, waitUntil }) {
    if (wait && wait > 0) {
      return new Date(Date.now() + wait * 1e3);
    } else if (waitUntil) {
      return waitUntil;
    } else {
      return /* @__PURE__ */ new Date();
    }
  }
  buildPayload(job, args, options) {
    const queue = job.queue;
    const priority = job.priority ?? import_consts.DEFAULT_PRIORITY;
    const wait = options?.wait ?? import_consts.DEFAULT_WAIT;
    const waitUntil = options?.waitUntil ?? import_consts.DEFAULT_WAIT_UNTIL;
    if (!queue) {
      throw new import_errors.QueueNotDefinedError();
    }
    return {
      name: job.name,
      path: job.path,
      args: args ?? [],
      runAt: this.computeRunAt({ wait, waitUntil }),
      queue,
      priority
    };
  }
  async schedule({
    job,
    jobArgs,
    jobOptions
  }) {
    const payload = this.buildPayload(job, jobArgs, jobOptions);
    this.logger.info(payload, `[RedwoodJob] Scheduling ${job.name}`);
    try {
      await this.adapter.schedule(payload);
      return true;
    } catch (e) {
      throw new import_errors.SchedulingError(
        `[RedwoodJob] Exception when scheduling ${payload.name}`,
        e
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Scheduler
});
