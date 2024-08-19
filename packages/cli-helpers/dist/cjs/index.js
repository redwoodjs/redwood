"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
module.exports = __toCommonJS(src_exports);
__reExport(src_exports, require("./lib/index.js"), module.exports);
__reExport(src_exports, require("./lib/colors.js"), module.exports);
__reExport(src_exports, require("./lib/paths.js"), module.exports);
__reExport(src_exports, require("./lib/project.js"), module.exports);
__reExport(src_exports, require("./lib/version.js"), module.exports);
__reExport(src_exports, require("./auth/setupHelpers.js"), module.exports);
__reExport(src_exports, require("./lib/installHelpers.js"), module.exports);
__reExport(src_exports, require("./telemetry/index.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./lib/index.js"),
  ...require("./lib/colors.js"),
  ...require("./lib/paths.js"),
  ...require("./lib/project.js"),
  ...require("./lib/version.js"),
  ...require("./auth/setupHelpers.js"),
  ...require("./lib/installHelpers.js"),
  ...require("./telemetry/index.js")
});
