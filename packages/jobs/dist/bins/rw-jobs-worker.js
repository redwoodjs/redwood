#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_node_console = __toESM(require("node:console"));
var import_node_process = __toESM(require("node:process"));
var import_helpers = require("yargs/helpers");
var import_yargs = __toESM(require("yargs/yargs"));
var import_loadEnvFiles = require("@redwoodjs/cli-helpers/loadEnvFiles");
var import_consts = require("../consts");
var import_errors = require("../errors");
var import_loaders = require("../loaders");
(0, import_loadEnvFiles.loadEnvFiles)();
const parseArgs = (argv) => {
  return (0, import_yargs.default)((0, import_helpers.hideBin)(argv)).usage(
    "Starts a single RedwoodJob worker to process background jobs\n\nUsage: $0 [options]"
  ).option("index", {
    type: "number",
    description: "The index of the `workers` array from the exported `jobs` config to use to configure this worker",
    default: 0
  }).option("id", {
    type: "number",
    description: "The worker count id to identify this worker. ie: if you had `count: 2` in your worker config, you would have two workers with ids 0 and 1",
    default: 0
  }).option("workoff", {
    type: "boolean",
    default: false,
    description: "Work off all jobs in the queue(s) and exit"
  }).option("clear", {
    type: "boolean",
    default: false,
    description: "Remove all jobs in all queues and exit"
  }).help().argv;
};
const setProcessTitle = ({
  id,
  queue
}) => {
  import_node_process.default.title = `${import_consts.PROCESS_TITLE_PREFIX}.${[queue].flat().join("-")}.${id}`;
};
const setupSignals = ({
  worker,
  logger
}) => {
  import_node_process.default.on("SIGINT", () => {
    logger.warn(
      `[${import_node_process.default.title}] SIGINT received at ${(/* @__PURE__ */ new Date()).toISOString()}, finishing work...`
    );
    worker.forever = false;
  });
  import_node_process.default.on("SIGTERM", () => {
    logger.warn(
      `[${import_node_process.default.title}] SIGTERM received at ${(/* @__PURE__ */ new Date()).toISOString()}, exiting now!`
    );
    import_node_process.default.exit(0);
  });
};
const main = async () => {
  const { index, id, clear, workoff } = await parseArgs(import_node_process.default.argv);
  let manager;
  try {
    manager = await (0, import_loaders.loadJobsManager)();
  } catch (e) {
    import_node_console.default.error(e);
    import_node_process.default.exit(1);
  }
  const workerConfig = manager.workers[index];
  if (!workerConfig) {
    throw new import_errors.WorkerConfigIndexNotFoundError(index);
  }
  const logger = workerConfig.logger ?? manager.logger ?? import_consts.DEFAULT_LOGGER;
  logger.warn(
    `[${import_node_process.default.title}] Starting work at ${(/* @__PURE__ */ new Date()).toISOString()}...`
  );
  setProcessTitle({ id, queue: workerConfig.queue });
  const worker = manager.createWorker({ index, clear, workoff });
  worker.run().then(() => {
    logger.info(`[${import_node_process.default.title}] Worker finished, shutting down.`);
    import_node_process.default.exit(0);
  });
  setupSignals({ worker, logger });
};
if (import_node_process.default.env.NODE_ENV !== "test") {
  main();
}
