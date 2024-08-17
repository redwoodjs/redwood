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
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_chalk = __toESM(require("chalk"));
var import_chokidar = __toESM(require("chokidar"));
var import_project_config = require("@redwoodjs/project-config");
var import_cliLogger = require("../cliLogger");
var import_files = require("../files");
var import_routes = require("../routes");
var import_clientPreset = require("./clientPreset");
var import_generate = require("./generate");
var import_graphqlCodeGen = require("./graphqlCodeGen");
var import_graphqlSchema = require("./graphqlSchema");
var import_typeDefinitions = require("./typeDefinitions");
const rwjsPaths = (0, import_project_config.getPaths)();
const watcher = import_chokidar.default.watch("(web|api)/src/**/*.{ts,js,jsx,tsx}", {
  persistent: true,
  ignored: ["node_modules", ".redwood"],
  ignoreInitial: true,
  cwd: rwjsPaths.base,
  awaitWriteFinish: true
});
const action = {
  add: "Created",
  unlink: "Deleted",
  change: "Modified"
};
let routesWarningMessage = "";
process.stdin.on("data", async (data) => {
  const str = data.toString().trim().toLowerCase();
  if (str === "g" || str === "rs") {
    (0, import_cliLogger.cliLogger)("Re-creating TypeScript definitions and GraphQL schemas");
    await (0, import_generate.generate)();
  }
});
watcher.on("ready", async () => {
  const start = Date.now();
  (0, import_cliLogger.cliLogger)("Generating full TypeScript definitions and GraphQL schemas");
  const { files, errors } = await (0, import_generate.generate)();
  (0, import_cliLogger.cliLogger)(`Done.`);
  import_cliLogger.cliLogger.debug(`
Created ${files.length} in ${Date.now() - start} ms`);
  if (errors.length > 0) {
    for (const { message, error } of errors) {
      console.error(message);
      console.error(error);
      console.log();
    }
  }
  routesWarningMessage = (0, import_routes.warningForDuplicateRoutes)();
  if (routesWarningMessage) {
    console.warn(routesWarningMessage);
  }
}).on("all", async (eventName, p) => {
  import_cliLogger.cliLogger.trace(
    `File system change: ${import_chalk.default.magenta(eventName)} ${import_chalk.default.dim(p)}`
  );
  if (!["add", "change", "unlink"].includes(eventName)) {
    return;
  }
  const eventTigger = eventName;
  const absPath = import_path.default.join(rwjsPaths.base, p);
  const start = Date.now();
  const finished = (type) => import_cliLogger.cliLogger.debug(
    action[eventTigger],
    type + ":",
    import_chalk.default.dim(p),
    import_chalk.default.dim.italic(Date.now() - start + " ms")
  );
  if (absPath.includes("Cell") && (0, import_files.isCellFile)(absPath)) {
    await (0, import_graphqlCodeGen.generateTypeDefGraphQLWeb)();
    await (0, import_clientPreset.generateClientPreset)();
    if (eventName === "unlink") {
      import_fs.default.unlinkSync((0, import_typeDefinitions.mirrorPathForCell)(absPath, rwjsPaths)[0]);
    } else {
      (0, import_typeDefinitions.generateMirrorCell)(absPath, rwjsPaths);
    }
    finished("Cell");
  } else if (absPath === rwjsPaths.web.routes) {
    (0, import_typeDefinitions.generateTypeDefRouterRoutes)();
    routesWarningMessage = (0, import_routes.warningForDuplicateRoutes)();
    finished("Routes");
  } else if (absPath.includes("Page") && (0, import_files.isPageFile)(absPath)) {
    (0, import_typeDefinitions.generateTypeDefRouterPages)();
    finished("Page");
  } else if ((0, import_files.isDirectoryNamedModuleFile)(absPath)) {
    if (eventName === "unlink") {
      import_fs.default.unlinkSync((0, import_typeDefinitions.mirrorPathForDirectoryNamedModules)(absPath, rwjsPaths)[0]);
    } else {
      (0, import_typeDefinitions.generateMirrorDirectoryNamedModule)(absPath, rwjsPaths);
    }
    finished("Directory named module");
  } else if ((0, import_files.isGraphQLSchemaFile)(absPath)) {
    await (0, import_graphqlSchema.generateGraphQLSchema)();
    await (0, import_graphqlCodeGen.generateTypeDefGraphQLApi)();
    finished("GraphQL Schema");
  }
  if (routesWarningMessage) {
    console.warn(routesWarningMessage);
  }
});
