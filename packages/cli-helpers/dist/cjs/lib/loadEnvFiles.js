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
var loadEnvFiles_exports = {};
__export(loadEnvFiles_exports, {
  loadDefaultEnvFiles: () => loadDefaultEnvFiles,
  loadEnvFiles: () => loadEnvFiles,
  loadNodeEnvDerivedEnvFile: () => loadNodeEnvDerivedEnvFile,
  loadUserSpecifiedEnvFiles: () => loadUserSpecifiedEnvFiles
});
module.exports = __toCommonJS(loadEnvFiles_exports);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_dotenv = require("dotenv");
var import_dotenv_defaults = require("dotenv-defaults");
var import_helpers = require("yargs/helpers");
var import_project_config = require("@redwoodjs/project-config");
function loadEnvFiles() {
  if (process.env.REDWOOD_ENV_FILES_LOADED) {
    return;
  }
  const { base } = (0, import_project_config.getPaths)();
  loadDefaultEnvFiles(base);
  loadNodeEnvDerivedEnvFile(base);
  const { loadEnvFiles: loadEnvFiles2 } = import_helpers.Parser.default((0, import_helpers.hideBin)(process.argv), {
    array: ["load-env-files"],
    default: {
      loadEnvFiles: []
    }
  });
  if (loadEnvFiles2.length > 0) {
    loadUserSpecifiedEnvFiles(base, loadEnvFiles2);
  }
  process.env.REDWOOD_ENV_FILES_LOADED = "true";
}
function loadDefaultEnvFiles(cwd) {
  (0, import_dotenv_defaults.config)({
    path: import_node_path.default.join(cwd, ".env"),
    defaults: import_node_path.default.join(cwd, ".env.defaults"),
    // @ts-expect-error - Old typings. @types/dotenv-defaults depends on dotenv
    // v8. dotenv-defaults uses dotenv v14
    multiline: true
  });
}
function loadNodeEnvDerivedEnvFile(cwd) {
  if (!process.env.NODE_ENV) {
    return;
  }
  const nodeEnvDerivedEnvFilePath = import_node_path.default.join(
    cwd,
    `.env.${process.env.NODE_ENV}`
  );
  if (!import_node_fs.default.existsSync(nodeEnvDerivedEnvFilePath)) {
    return;
  }
  (0, import_dotenv.config)({ path: nodeEnvDerivedEnvFilePath, override: true });
}
function loadUserSpecifiedEnvFiles(cwd, loadEnvFiles2) {
  for (const suffix of loadEnvFiles2) {
    const envPath = import_node_path.default.join(cwd, `.env.${suffix}`);
    if (!import_node_fs.default.existsSync(envPath)) {
      throw new Error(
        `Couldn't find an .env file at '${envPath}' as specified by '--load-env-files'`
      );
    }
    (0, import_dotenv.config)({ path: envPath, override: true });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loadDefaultEnvFiles,
  loadEnvFiles,
  loadNodeEnvDerivedEnvFile,
  loadUserSpecifiedEnvFiles
});
