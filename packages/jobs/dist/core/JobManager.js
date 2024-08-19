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
var JobManager_exports = {};
__export(JobManager_exports, {
  JobManager: () => JobManager
});
module.exports = __toCommonJS(JobManager_exports);
var import_errors = require("../errors");
var import_Scheduler = require("./Scheduler");
var import_Worker = require("./Worker");
class JobManager {
  adapters;
  queues;
  logger;
  workers;
  constructor(config) {
    this.adapters = config.adapters;
    this.queues = config.queues;
    this.logger = config.logger;
    this.workers = config.workers;
  }
  createScheduler(schedulerConfig) {
    const scheduler = new import_Scheduler.Scheduler({
      adapter: this.adapters[schedulerConfig.adapter],
      logger: this.logger
    });
    return (job, jobArgs, jobOptions) => {
      return scheduler.schedule({ job, jobArgs, jobOptions });
    };
  }
  createJob(jobDefinition) {
    return jobDefinition;
  }
  createWorker({ index, workoff, clear }) {
    const config = this.workers[index];
    const adapter = this.adapters[config.adapter];
    if (!adapter) {
      throw new import_errors.AdapterNotFoundError(config.adapter.toString());
    }
    return new import_Worker.Worker({
      adapter: this.adapters[config.adapter],
      logger: config.logger || this.logger,
      maxAttempts: config.maxAttempts,
      maxRuntime: config.maxRuntime,
      sleepDelay: config.sleepDelay,
      deleteFailedJobs: config.deleteFailedJobs,
      processName: process.title,
      queues: [config.queue].flat(),
      workoff,
      clear
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JobManager
});
