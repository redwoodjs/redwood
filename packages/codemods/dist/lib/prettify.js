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
var prettify_exports = {};
__export(prettify_exports, {
  default: () => prettify_default
});
module.exports = __toCommonJS(prettify_exports);
var import_path = __toESM(require("path"));
var import_prettier = require("prettier");
var import_project_config = require("@redwoodjs/project-config");
const getPrettierConfig = async () => {
  try {
    const { default: prettierConfig } = await import(`file://${import_path.default.join((0, import_project_config.getPaths)().base, "prettier.config.js")}`);
    return prettierConfig;
  } catch {
    return void 0;
  }
};
const prettify = async (code, options = {}) => {
  const prettierConfig = await getPrettierConfig();
  return (0, import_prettier.format)(code, {
    singleQuote: true,
    semi: false,
    ...prettierConfig,
    parser: "babel",
    ...options
  });
};
var prettify_default = prettify;
