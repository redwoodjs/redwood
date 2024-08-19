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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var rw_jobs_exports = {};
module.exports = __toCommonJS(rw_jobs_exports);
var import_node_child_process = require("node:child_process");
var import_node_console = __toESM(require("node:console"));
var import_node_path = __toESM(require("node:path"));
var import_node_process = __toESM(require("node:process"));
var import_node_timers = require("node:timers");
var import_helpers = require("yargs/helpers");
var import_yargs = __toESM(require("yargs/yargs"));
var import_loadEnvFiles = require("@redwoodjs/cli-helpers/loadEnvFiles");
var import_consts = require("../consts");
var import_loaders = require("../loaders");
(0, import_loadEnvFiles.loadEnvFiles)();
import_node_process.default.title = "rw-jobs";
const parseArgs = (argv) => {
  const parsed = (0, import_yargs.default)((0, import_helpers.hideBin)(argv)).usage(
    "Starts the RedwoodJob runner to process background jobs\n\nUsage: $0 <command> [options]"
  ).command("work", "Start a worker and process jobs").command("workoff", "Start a worker and exit after all jobs processed").command("start", "Start workers in daemon mode").command("stop", "Stop any daemonized job workers").command("restart", "Stop and start any daemonized job workers").command("clear", "Clear the job queue").demandCommand(1, "You must specify a mode to start in").example(
    "$0 start -n 2",
    "Start the job runner with 2 workers in daemon mode"
  ).example(
    "$0 start -n default:2,email:1",
    'Start the job runner in daemon mode with 2 workers for the "default" queue and 1 for the "email" queue'
  ).help().argv;
  return { command: parsed._[0] };
};
const buildNumWorkers = (config) => {
  const workers = [];
  config.map((worker, index) => {
    for (let id = 0; id < worker.count; id++) {
      workers.push([index, id]);
    }
  });
  return workers;
};
const startWorkers = ({
  numWorkers,
  detach = false,
  workoff = false,
  logger
}) => {
  logger.warn(`Starting ${numWorkers.length} worker(s)...`);
  return numWorkers.map(([index, id]) => {
    const workerArgs = [];
    workerArgs.push("--index", index.toString());
    workerArgs.push("--id", id.toString());
    if (workoff) {
      workerArgs.push("--workoff");
    }
    const worker = (0, import_node_child_process.fork)(import_node_path.default.join(__dirname, "rw-jobs-worker.js"), workerArgs, {
      detached: detach,
      stdio: detach ? "ignore" : "inherit",
      env: import_node_process.default.env
    });
    if (detach) {
      worker.unref();
    } else {
      worker.on("exit", (_code) => {
      });
    }
    return worker;
  });
};
const stopWorkers = async ({
  numWorkers,
  signal = "SIGINT",
  logger
}) => {
  logger.warn(
    `Stopping ${numWorkers.length} worker(s) gracefully (${signal})...`
  );
  const processIds = await findWorkerProcesses();
  if (processIds.length === 0) {
    logger.warn(`No running workers found.`);
    return;
  }
  for (const processId of processIds) {
    logger.info(`Stopping process id ${processId}...`);
    import_node_process.default.kill(processId, signal);
    while ((await findWorkerProcesses(processId)).length) {
      await new Promise((resolve) => (0, import_node_timers.setTimeout)(resolve, 250));
    }
  }
};
const clearQueue = ({ logger }) => {
  logger.warn(`Starting worker to clear job queue...`);
  (0, import_node_child_process.fork)(import_node_path.default.join(__dirname, "rw-jobs-worker.js"), ["--clear"]);
};
const signalSetup = ({
  workers,
  logger
}) => {
  let sigtermCount = 0;
  import_node_process.default.on("SIGINT", () => {
    sigtermCount++;
    let message = "SIGINT received: shutting down workers gracefully (press Ctrl-C again to exit immediately)...";
    if (sigtermCount > 1) {
      message = "SIGINT received again, exiting immediately...";
    }
    logger.info(message);
    workers.forEach((worker) => {
      if (sigtermCount > 1) {
        worker.kill("SIGTERM");
      } else {
        worker.kill("SIGINT");
      }
    });
  });
};
const findWorkerProcesses = async (id) => {
  return new Promise(function(resolve, reject) {
    const plat = import_node_process.default.platform;
    const cmd = plat === "win32" ? "tasklist" : plat === "darwin" ? "ps -ax | grep " + import_consts.PROCESS_TITLE_PREFIX : plat === "linux" ? "ps -A" : "";
    if (cmd === "") {
      resolve([]);
    }
    (0, import_node_child_process.exec)(cmd, function(err, stdout) {
      if (err) {
        reject(err);
      }
      const list = stdout.trim().split("\n");
      const matches = list.filter((line) => {
        if (plat == "darwin" || plat == "linux") {
          return !line.match("grep");
        }
        return true;
      });
      if (matches.length === 0) {
        resolve([]);
      }
      const pids = matches.map((line) => parseInt(line.split(" ")[0]));
      if (id) {
        resolve(pids.filter((pid) => pid === id));
      } else {
        resolve(pids);
      }
    });
  });
};
const main = async () => {
  const { command } = parseArgs(import_node_process.default.argv);
  let jobsConfig;
  try {
    jobsConfig = await (0, import_loaders.loadJobsManager)();
  } catch (e) {
    import_node_console.default.error(e);
    import_node_process.default.exit(1);
  }
  const workerConfig = jobsConfig.workers;
  const numWorkers = buildNumWorkers(workerConfig);
  const logger = jobsConfig.logger ?? import_consts.DEFAULT_LOGGER;
  logger.warn(`Starting RedwoodJob Runner at ${(/* @__PURE__ */ new Date()).toISOString()}...`);
  switch (command) {
    case "start":
      startWorkers({
        numWorkers,
        detach: true,
        logger
      });
      return import_node_process.default.exit(0);
    case "restart":
      await stopWorkers({ numWorkers, signal: "SIGINT", logger });
      startWorkers({
        numWorkers,
        detach: true,
        logger
      });
      return import_node_process.default.exit(0);
    case "work":
      return signalSetup({
        workers: startWorkers({
          numWorkers,
          logger
        }),
        logger
      });
    case "workoff":
      return signalSetup({
        workers: startWorkers({
          numWorkers,
          workoff: true,
          logger
        }),
        logger
      });
    case "stop":
      return await stopWorkers({
        numWorkers,
        signal: "SIGINT",
        logger
      });
    case "clear":
      return clearQueue({ logger });
  }
};
if (import_node_process.default.env.NODE_ENV !== "test") {
  main();
}
