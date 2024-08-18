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
var updateNodeEngineTo18_yargs_exports = {};
__export(updateNodeEngineTo18_yargs_exports, {
  command: () => command,
  description: () => description,
  handler: () => handler
});
module.exports = __toCommonJS(updateNodeEngineTo18_yargs_exports);
var import_tasuku = __toESM(require("tasuku"));
var import_updateNodeEngineTo18 = require("./updateNodeEngineTo18");
const command = "update-node-engine-to-18";
const description = '(v4.x.x->v5.x.x) Updates `engines.node` to `"=18.x"` in your project\'s root package.json';
const handler = () => {
  (0, import_tasuku.default)(
    'Updating `engines.node` to `"=18.x"` in root package.json',
    async ({ setError }) => {
      try {
        await (0, import_updateNodeEngineTo18.updateNodeEngineTo18)();
      } catch (e) {
        setError("Failed to codemod your project \n" + e?.message);
      }
    }
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  command,
  description,
  handler
});
