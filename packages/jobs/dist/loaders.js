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
var loaders_exports = {};
__export(loaders_exports, {
  loadJob: () => loadJob,
  loadJobsManager: () => loadJobsManager
});
module.exports = __toCommonJS(loaders_exports);
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var import_project_config = require("@redwoodjs/project-config");
var import_errors = require("./errors");
var import_util = require("./util");
const loadJobsManager = async () => {
  const jobsConfigPath = (0, import_project_config.getPaths)().api.distJobsConfig;
  if (!jobsConfigPath) {
    throw new import_errors.JobsLibNotFoundError();
  }
  const importPath = (0, import_util.makeFilePath)(jobsConfigPath);
  const { jobs } = await import(importPath);
  if (!jobs) {
    throw new import_errors.JobsLibNotFoundError();
  }
  return jobs;
};
const loadJob = async ({
  name: jobName,
  path: jobPath
}) => {
  const completeJobPath = import_node_path.default.join((0, import_project_config.getPaths)().api.distJobs, jobPath) + ".js";
  if (!import_node_fs.default.existsSync(completeJobPath)) {
    throw new import_errors.JobNotFoundError(jobName);
  }
  const importPath = (0, import_util.makeFilePath)(completeJobPath);
  const jobModule = await import(importPath);
  if (!jobModule[jobName]) {
    throw new import_errors.JobNotFoundError(jobName);
  }
  return jobModule[jobName];
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loadJob,
  loadJobsManager
});
