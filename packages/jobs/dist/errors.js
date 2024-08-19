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
var errors_exports = {};
__export(errors_exports, {
  AdapterNotConfiguredError: () => AdapterNotConfiguredError,
  AdapterNotFoundError: () => AdapterNotFoundError,
  AdapterRequiredError: () => AdapterRequiredError,
  JobExportNotFoundError: () => JobExportNotFoundError,
  JobNotFoundError: () => JobNotFoundError,
  JobRequiredError: () => JobRequiredError,
  JobsLibNotFoundError: () => JobsLibNotFoundError,
  LoggerNotFoundError: () => LoggerNotFoundError,
  PerformError: () => PerformError,
  QueueNotDefinedError: () => QueueNotDefinedError,
  QueuesRequiredError: () => QueuesRequiredError,
  RedwoodJobError: () => RedwoodJobError,
  RethrownJobError: () => RethrownJobError,
  SchedulingError: () => SchedulingError,
  WorkerConfigIndexNotFoundError: () => WorkerConfigIndexNotFoundError,
  WorkerConfigNotFoundError: () => WorkerConfigNotFoundError
});
module.exports = __toCommonJS(errors_exports);
const JOBS_CONFIG_FILENAME = "jobs.ts/js";
class RedwoodJobError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
class AdapterNotConfiguredError extends RedwoodJobError {
  constructor() {
    super("No adapter configured for the job scheduler");
  }
}
class AdapterRequiredError extends RedwoodJobError {
  constructor() {
    super("`adapter` is required to perform a job");
  }
}
class QueuesRequiredError extends RedwoodJobError {
  constructor() {
    super("`queues` is required to find a job to run");
  }
}
class JobRequiredError extends RedwoodJobError {
  constructor() {
    super("`job` is required to perform a job");
  }
}
class JobNotFoundError extends RedwoodJobError {
  constructor(name) {
    super(`Job \`${name}\` not found in the filesystem`);
  }
}
class JobExportNotFoundError extends RedwoodJobError {
  constructor(name) {
    super(`Job file \`${name}\` does not export a class with the same name`);
  }
}
class JobsLibNotFoundError extends RedwoodJobError {
  constructor() {
    super(
      `api/src/lib/${JOBS_CONFIG_FILENAME} not found. Run \`yarn rw setup jobs\` to create this file and configure background jobs`
    );
  }
}
class AdapterNotFoundError extends RedwoodJobError {
  constructor(name) {
    super(
      `api/src/lib/${JOBS_CONFIG_FILENAME} does not export an adapter named \`${name}\``
    );
  }
}
class LoggerNotFoundError extends RedwoodJobError {
  constructor(name) {
    super(
      `api/src/lib/${JOBS_CONFIG_FILENAME} does not export a logger named \`${name}\``
    );
  }
}
class WorkerConfigNotFoundError extends RedwoodJobError {
  constructor(name) {
    super(`api/src/lib/#{JOBS_CONFIG_FILENAME} does not export \`${name}\``);
  }
}
class RethrownJobError extends RedwoodJobError {
  originalError;
  stackBeforeRethrow;
  constructor(message, error) {
    super(message);
    if (!error) {
      throw new Error(
        "RethrownJobError requires a message and existing error object"
      );
    }
    this.originalError = error;
    this.stackBeforeRethrow = this.stack;
    const messageLines = (this.message.match(/\n/g) || []).length + 1;
    this.stack = this.stack?.split("\n").slice(0, messageLines + 1).join("\n") + "\n" + error.stack;
  }
}
class SchedulingError extends RethrownJobError {
  constructor(message, error) {
    super(message, error);
  }
}
class PerformError extends RethrownJobError {
  constructor(message, error) {
    super(message, error);
  }
}
class QueueNotDefinedError extends RedwoodJobError {
  constructor() {
    super("Scheduler requires a named `queue` to place jobs in");
  }
}
class WorkerConfigIndexNotFoundError extends RedwoodJobError {
  constructor(index) {
    super(`Worker index ${index} not found in jobs config`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdapterNotConfiguredError,
  AdapterNotFoundError,
  AdapterRequiredError,
  JobExportNotFoundError,
  JobNotFoundError,
  JobRequiredError,
  JobsLibNotFoundError,
  LoggerNotFoundError,
  PerformError,
  QueueNotDefinedError,
  QueuesRequiredError,
  RedwoodJobError,
  RethrownJobError,
  SchedulingError,
  WorkerConfigIndexNotFoundError,
  WorkerConfigNotFoundError
});
