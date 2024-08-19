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
__reExport(src_exports, require("./context.js"), module.exports);
var import_global_api_auto_imports = require("./global.api-auto-imports.js");
__reExport(src_exports, require("./global.api-auto-imports.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./context.js"),
  ...require("./global.api-auto-imports.js")
});
