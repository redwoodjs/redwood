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
var paths_exports = {};
__export(paths_exports, {
  getPaths: () => getPaths
});
module.exports = __toCommonJS(paths_exports);
var import_project_config = require("@redwoodjs/project-config");
var import_colors = require("./colors.js");
function isErrorWithMessage(e) {
  return !!e.message;
}
function getPaths() {
  try {
    return (0, import_project_config.getPaths)();
  } catch (e) {
    if (isErrorWithMessage(e)) {
      console.error(import_colors.colors.error(e.message));
    }
    process.exit(1);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPaths
});
