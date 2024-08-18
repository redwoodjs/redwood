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
var ts2js_exports = {};
__export(ts2js_exports, {
  default: () => ts2js_default
});
module.exports = __toCommonJS(ts2js_exports);
var import_core = require("@babel/core");
var import_project_config = require("@redwoodjs/project-config");
var import_prettify = __toESM(require("./prettify"));
const ts2js = (file) => {
  const result = (0, import_core.transform)(file, {
    cwd: (0, import_project_config.getPaths)().base,
    configFile: false,
    plugins: [
      [
        "@babel/plugin-transform-typescript",
        {
          isTSX: true,
          allExtensions: true
        }
      ]
    ],
    retainLines: true
  });
  if (result?.code) {
    return (0, import_prettify.default)(result.code);
  }
  return null;
};
var ts2js_default = ts2js;
