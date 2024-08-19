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
var installHelpers_exports = {};
__export(installHelpers_exports, {
  addApiPackages: () => addApiPackages,
  addRootPackages: () => addRootPackages,
  addWebPackages: () => addWebPackages,
  installPackages: () => installPackages
});
module.exports = __toCommonJS(installHelpers_exports);
var import_execa = __toESM(require("execa"), 1);
var import_paths = require("./paths.js");
const addWebPackages = (webPackages) => ({
  title: "Adding required web packages...",
  task: async () => {
    await (0, import_execa.default)("yarn", ["add", ...webPackages], { cwd: (0, import_paths.getPaths)().web.base });
  }
});
const addApiPackages = (apiPackages) => ({
  title: "Adding required api packages...",
  task: async () => {
    await (0, import_execa.default)("yarn", ["add", ...apiPackages], { cwd: (0, import_paths.getPaths)().api.base });
  }
});
const addRootPackages = (packages, devDependency = false) => {
  const addMode = devDependency ? ["add", "-D"] : ["add"];
  return {
    title: "Installing packages...",
    task: async () => {
      await (0, import_execa.default)("yarn", [...addMode, ...packages], { cwd: (0, import_paths.getPaths)().base });
    }
  };
};
const installPackages = {
  title: "Installing packages...",
  task: async () => {
    await (0, import_execa.default)("yarn", ["install"], { cwd: (0, import_paths.getPaths)().base });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addApiPackages,
  addRootPackages,
  addWebPackages,
  installPackages
});
