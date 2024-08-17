"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cliLogger_exports = {};
__export(cliLogger_exports, {
  cliLogger: () => cliLogger
});
module.exports = __toCommonJS(cliLogger_exports);
var import_logger = require("@redwoodjs/api/logger");
const logLevel = import_logger.defaultLoggerOptions.level;
const cliLogger = function(...data) {
  console.log(...data);
};
cliLogger.trace = logLevel === "trace" ? console.log : () => {
};
cliLogger.debug = logLevel === "trace" || logLevel === "debug" ? console.log : () => {
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cliLogger
});
