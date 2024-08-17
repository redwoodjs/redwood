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
var project_exports = {};
__export(project_exports, {
  getTsConfigs: () => getTsConfigs,
  isRealtimeSetup: () => isRealtimeSetup,
  isServerFileSetup: () => isServerFileSetup,
  isTypeScriptProject: () => isTypeScriptProject
});
module.exports = __toCommonJS(project_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_typescript = require("typescript");
var import_project_config = require("@redwoodjs/project-config");
const getTsConfigs = () => {
  const rwPaths = (0, import_project_config.getPaths)();
  const apiTsConfigPath = import_path.default.join(rwPaths.api.base, "tsconfig.json");
  const webTsConfigPath = import_path.default.join(rwPaths.web.base, "tsconfig.json");
  const apiTsConfig = import_fs.default.existsSync(apiTsConfigPath) ? (0, import_typescript.parseConfigFileTextToJson)(
    apiTsConfigPath,
    import_fs.default.readFileSync(apiTsConfigPath, "utf-8")
  ) : null;
  const webTsConfig = import_fs.default.existsSync(webTsConfigPath) ? (0, import_typescript.parseConfigFileTextToJson)(
    webTsConfigPath,
    import_fs.default.readFileSync(webTsConfigPath, "utf-8")
  ) : null;
  return {
    api: apiTsConfig?.config ?? null,
    web: webTsConfig?.config ?? null
  };
};
const isTypeScriptProject = () => {
  const paths = (0, import_project_config.getPaths)();
  return import_fs.default.existsSync(import_path.default.join(paths.web.base, "tsconfig.json")) || import_fs.default.existsSync(import_path.default.join(paths.api.base, "tsconfig.json"));
};
const isServerFileSetup = () => {
  const serverFilePath = import_path.default.join(
    (0, import_project_config.getPaths)().api.src,
    `server.${isTypeScriptProject() ? "ts" : "js"}`
  );
  return import_fs.default.existsSync(serverFilePath);
};
const isRealtimeSetup = () => {
  const realtimePath = import_path.default.join(
    (0, import_project_config.getPaths)().api.lib,
    `realtime.${isTypeScriptProject() ? "ts" : "js"}`
  );
  return import_fs.default.existsSync(realtimePath);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTsConfigs,
  isRealtimeSetup,
  isServerFileSetup,
  isTypeScriptProject
});
