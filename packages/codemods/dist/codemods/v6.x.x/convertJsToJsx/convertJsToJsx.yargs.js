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
var convertJsToJsx_yargs_exports = {};
__export(convertJsToJsx_yargs_exports, {
  command: () => command,
  description: () => description,
  handler: () => handler
});
module.exports = __toCommonJS(convertJsToJsx_yargs_exports);
var import_path = __toESM(require("path"));
var import_fast_glob = __toESM(require("fast-glob"));
var import_tasuku = __toESM(require("tasuku"));
var import_runTransform = __toESM(require("../../../lib/runTransform"));
const command = "convert-js-to-jsx";
const description = "(v5.x.x->v6.x.x) Converts web components from .js to .jsx";
const handler = () => {
  (0, import_tasuku.default)("Convert Js To Jsx", async ({ setOutput }) => {
    await (0, import_runTransform.default)({
      transformPath: import_path.default.join(__dirname, "convertJsToJsx.js"),
      // All files in web/src that are .js
      targetPaths: import_fast_glob.default.sync("web/src/**/*.js")
    });
    setOutput(
      "All done! Your file contents have not been changed just the extension."
    );
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  command,
  description,
  handler
});
