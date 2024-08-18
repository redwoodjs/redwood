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
var runTransform_exports = {};
__export(runTransform_exports, {
  default: () => runTransform_default,
  runTransform: () => runTransform
});
module.exports = __toCommonJS(runTransform_exports);
var jscodeshift = __toESM(require("jscodeshift/src/Runner"));
const defaultJscodeshiftOpts = {
  verbose: 0,
  dry: false,
  print: false,
  babel: true,
  ignorePattern: "**/node_modules/**",
  ignoreConfig: [],
  runInBand: false,
  silent: false,
  parser: "babel",
  parserConfig: {},
  failOnError: false,
  stdin: false
};
const runTransform = async ({
  transformPath,
  targetPaths,
  parser = "tsx",
  options = {}
}) => {
  try {
    if (process.env.NODE_ENV === "test" && process.env.RWJS_CWD) {
      process.chdir(process.env.RWJS_CWD);
    }
    await jscodeshift.run(transformPath, targetPaths, {
      ...defaultJscodeshiftOpts,
      parser,
      babel: process.env.NODE_ENV === "test",
      ...options
      // Putting options here lets them override all the defaults.
    });
  } catch (e) {
    console.error("Transform Error", e.message);
    throw new Error("Failed to invoke transform");
  }
};
var runTransform_default = runTransform;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runTransform
});
