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
var Worker_exports = {};
__export(Worker_exports, {
  Worker: () => Worker
});
module.exports = __toCommonJS(Worker_exports);
var import_node_timers = require("node:timers");
var import_consts = require("../consts");
var import_errors = require("../errors");
var import_Executor = require("./Executor");
const DEFAULT_OPTIONS = {
  logger: import_consts.DEFAULT_LOGGER,
  clear: false,
  maxAttempts: import_consts.DEFAULT_MAX_ATTEMPTS,
  maxRuntime: import_consts.DEFAULT_MAX_RUNTIME,
  deleteSuccessfulJobs: import_consts.DEFAULT_DELETE_SUCCESSFUL_JOBS,
  deleteFailedJobs: import_consts.DEFAULT_DELETE_FAILED_JOBS,
  sleepDelay: import_consts.DEFAULT_SLEEP_DELAY,
  workoff: false,
  forever: true
};
class Worker {
  options;
  adapter;
  logger;
  clear;
  processName;
  queues;
  maxAttempts;
  maxRuntime;
  deleteSuccessfulJobs;
  deleteFailedJobs;
  sleepDelay;
  forever;
  workoff;
  lastCheckTime;
  constructor(options) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    if (!options?.adapter) {
      throw new import_errors.AdapterRequiredError();
    }
    if (!options?.queues || options.queues.length === 0) {
      throw new import_errors.QueuesRequiredError();
    }
    this.adapter = this.options.adapter;
    this.logger = this.options.logger;
    this.clear = this.options.clear;
    this.processName = this.options.processName;
    this.queues = this.options.queues;
    this.maxAttempts = this.options.maxAttempts;
    this.maxRuntime = this.options.maxRuntime;
    this.deleteSuccessfulJobs = this.options.deleteSuccessfulJobs;
    this.deleteFailedJobs = this.options.deleteFailedJobs;
    this.sleepDelay = this.options.sleepDelay * 1e3;
    this.forever = this.options.forever;
    this.workoff = this.options.workoff;
    this.lastCheckTime = /* @__PURE__ */ new Date();
  }
  // Workers run forever unless:
  // `this.forever` to false (loop only runs once, then exits)
  // `this.workoff` is true (run all jobs in the queue, then exits)
  run() {
    if (this.clear) {
      return this.#clearQueue();
    } else {
      return this.#work();
    }
  }
  get queueNames() {
    if (this.queues.length === 1 && this.queues[0] === "*") {
      return "all (*)";
    } else {
      return this.queues.join(", ");
    }
  }
  async #clearQueue() {
    return await this.adapter.clear();
  }
  async #work() {
    do {
      this.lastCheckTime = /* @__PURE__ */ new Date();
      this.logger.debug(
        `[${this.processName}] Checking for jobs in ${this.queueNames} queues...`
      );
      const job = await this.adapter.find({
        processName: this.processName,
        maxRuntime: this.maxRuntime,
        queues: this.queues
      });
      if (job) {
        await new import_Executor.Executor({
          adapter: this.adapter,
          logger: this.logger,
          job,
          maxAttempts: this.maxAttempts,
          deleteSuccessfulJobs: this.deleteSuccessfulJobs,
          deleteFailedJobs: this.deleteFailedJobs
        }).perform();
      } else if (this.workoff) {
        break;
      }
      if (!job && this.forever) {
        const millsSinceLastCheck = (/* @__PURE__ */ new Date()).getTime() - this.lastCheckTime.getTime();
        if (millsSinceLastCheck < this.sleepDelay) {
          await this.#wait(this.sleepDelay - millsSinceLastCheck);
        }
      }
    } while (this.forever);
  }
  #wait(ms) {
    return new Promise((resolve) => (0, import_node_timers.setTimeout)(resolve, ms));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Worker
});
