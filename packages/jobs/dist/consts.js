"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var consts_exports = {};
__export(consts_exports, {
  DEFAULT_ADAPTER_NAME: () => DEFAULT_ADAPTER_NAME,
  DEFAULT_DELETE_FAILED_JOBS: () => DEFAULT_DELETE_FAILED_JOBS,
  DEFAULT_DELETE_SUCCESSFUL_JOBS: () => DEFAULT_DELETE_SUCCESSFUL_JOBS,
  DEFAULT_LOGGER: () => DEFAULT_LOGGER,
  DEFAULT_LOGGER_NAME: () => DEFAULT_LOGGER_NAME,
  DEFAULT_MAX_ATTEMPTS: () => DEFAULT_MAX_ATTEMPTS,
  DEFAULT_MAX_RUNTIME: () => DEFAULT_MAX_RUNTIME,
  DEFAULT_MODEL_NAME: () => DEFAULT_MODEL_NAME,
  DEFAULT_PRIORITY: () => DEFAULT_PRIORITY,
  DEFAULT_QUEUE: () => DEFAULT_QUEUE,
  DEFAULT_SLEEP_DELAY: () => DEFAULT_SLEEP_DELAY,
  DEFAULT_WAIT: () => DEFAULT_WAIT,
  DEFAULT_WAIT_UNTIL: () => DEFAULT_WAIT_UNTIL,
  DEFAULT_WORK_QUEUE: () => DEFAULT_WORK_QUEUE,
  PROCESS_TITLE_PREFIX: () => PROCESS_TITLE_PREFIX
});
module.exports = __toCommonJS(consts_exports);
var import_node_console = __toESM(require("node:console"));
const DEFAULT_MAX_ATTEMPTS = 24;
const DEFAULT_MAX_RUNTIME = 14400;
const DEFAULT_SLEEP_DELAY = 5;
const DEFAULT_DELETE_SUCCESSFUL_JOBS = true;
const DEFAULT_DELETE_FAILED_JOBS = false;
const DEFAULT_LOGGER = import_node_console.default;
const DEFAULT_QUEUE = "default";
const DEFAULT_WORK_QUEUE = "*";
const DEFAULT_PRIORITY = 50;
const DEFAULT_WAIT = 0;
const DEFAULT_WAIT_UNTIL = null;
const PROCESS_TITLE_PREFIX = "rw-jobs-worker";
const DEFAULT_MODEL_NAME = "BackgroundJob";
const DEFAULT_ADAPTER_NAME = "adapter";
const DEFAULT_LOGGER_NAME = "logger";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_ADAPTER_NAME,
  DEFAULT_DELETE_FAILED_JOBS,
  DEFAULT_DELETE_SUCCESSFUL_JOBS,
  DEFAULT_LOGGER,
  DEFAULT_LOGGER_NAME,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_MAX_RUNTIME,
  DEFAULT_MODEL_NAME,
  DEFAULT_PRIORITY,
  DEFAULT_QUEUE,
  DEFAULT_SLEEP_DELAY,
  DEFAULT_WAIT,
  DEFAULT_WAIT_UNTIL,
  DEFAULT_WORK_QUEUE,
  PROCESS_TITLE_PREFIX
});
