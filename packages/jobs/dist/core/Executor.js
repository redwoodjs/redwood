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
var Executor_exports = {};
__export(Executor_exports, {
  DEFAULTS: () => DEFAULTS,
  Executor: () => Executor
});
module.exports = __toCommonJS(Executor_exports);
var import_consts = require("../consts");
var import_errors = require("../errors");
var import_loaders = require("../loaders");
const DEFAULTS = {
  logger: import_consts.DEFAULT_LOGGER,
  maxAttempts: import_consts.DEFAULT_MAX_ATTEMPTS,
  deleteFailedJobs: import_consts.DEFAULT_DELETE_FAILED_JOBS,
  deleteSuccessfulJobs: import_consts.DEFAULT_DELETE_SUCCESSFUL_JOBS
};
class Executor {
  options;
  adapter;
  logger;
  job;
  maxAttempts;
  deleteFailedJobs;
  deleteSuccessfulJobs;
  constructor(options) {
    this.options = { ...DEFAULTS, ...options };
    if (!this.options.adapter) {
      throw new import_errors.AdapterRequiredError();
    }
    if (!this.options.job) {
      throw new import_errors.JobRequiredError();
    }
    this.adapter = this.options.adapter;
    this.logger = this.options.logger;
    this.job = this.options.job;
    this.maxAttempts = this.options.maxAttempts;
    this.deleteFailedJobs = this.options.deleteFailedJobs;
    this.deleteSuccessfulJobs = this.options.deleteSuccessfulJobs;
  }
  get jobIdentifier() {
    return `${this.job.id} (${this.job.path}:${this.job.name})`;
  }
  async perform() {
    this.logger.info(`[RedwoodJob] Started job ${this.jobIdentifier}`);
    try {
      const job = await (0, import_loaders.loadJob)({ name: this.job.name, path: this.job.path });
      await job.perform(...this.job.args);
      await this.adapter.success({
        job: this.job,
        deleteJob: import_consts.DEFAULT_DELETE_SUCCESSFUL_JOBS
      });
    } catch (error) {
      this.logger.error(
        `[RedwoodJob] Error in job ${this.jobIdentifier}: ${error.message}`
      );
      this.logger.error(error.stack);
      await this.adapter.error({
        job: this.job,
        error
      });
      if (this.job.attempts >= this.maxAttempts) {
        this.logger.warn(
          this.job,
          `[RedwoodJob] Failed job ${this.jobIdentifier}: reached max attempts (${this.maxAttempts})`
        );
        await this.adapter.failure({
          job: this.job,
          deleteJob: this.deleteFailedJobs
        });
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULTS,
  Executor
});
