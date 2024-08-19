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
var utils_exports = {};
__export(utils_exports, {
  importReact: () => importReact,
  importRsdwClient: () => importRsdwClient,
  makeFilePath: () => makeFilePath
});
module.exports = __toCommonJS(utils_exports);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");
var import_project_config = require("@redwoodjs/project-config");
function makeFilePath(path2) {
  return (0, import_node_url.pathToFileURL)(path2).href;
}
async function importReact() {
  const distSsr = (0, import_project_config.getPaths)().web.distSsr;
  const reactPath = makeFilePath(import_node_path.default.join(distSsr, "__rwjs__react.mjs"));
  return (await import(reactPath)).default;
}
async function importRsdwClient() {
  const distSsr = (0, import_project_config.getPaths)().web.distSsr;
  const rsdwClientPath = makeFilePath(
    import_node_path.default.join(distSsr, "__rwjs__rsdw-client.mjs")
  );
  return (await import(rsdwClientPath)).default;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  importReact,
  importRsdwClient,
  makeFilePath
});
