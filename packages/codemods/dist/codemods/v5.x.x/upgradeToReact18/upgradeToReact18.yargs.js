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
var upgradeToReact18_yargs_exports = {};
__export(upgradeToReact18_yargs_exports, {
  command: () => command,
  description: () => description,
  handler: () => handler
});
module.exports = __toCommonJS(upgradeToReact18_yargs_exports);
var import_tasuku = __toESM(require("tasuku"));
var import_upgradeToReact18 = require("./upgradeToReact18");
const command = "upgrade-to-react-18";
const description = "(v4.x.x->v5.0.0) Upgrades a project to React 18 and checks the react root";
const handler = () => {
  (0, import_tasuku.default)("Check and transform react root", async (taskContext) => {
    (0, import_upgradeToReact18.checkAndTransformReactRoot)(taskContext);
  });
  (0, import_tasuku.default)("Check and update custom web index", async (taskContext) => {
    await (0, import_upgradeToReact18.checkAndUpdateCustomWebIndex)(taskContext);
  });
  (0, import_tasuku.default)("Update react deps", async () => {
    await (0, import_upgradeToReact18.upgradeReactDepsTo18)();
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  command,
  description,
  handler
});
