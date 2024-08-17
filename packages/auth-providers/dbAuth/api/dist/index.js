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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  PasswordValidationError: () => import_errors.PasswordValidationError,
  authDecoder: () => import_decoder.authDecoder,
  createAuthDecoder: () => import_decoder.createAuthDecoder
});
module.exports = __toCommonJS(src_exports);
__reExport(src_exports, require("./DbAuthHandler"), module.exports);
var import_errors = require("./errors");
__reExport(src_exports, require("./shared"), module.exports);
var import_decoder = require("./decoder");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PasswordValidationError,
  authDecoder,
  createAuthDecoder,
  ...require("./DbAuthHandler"),
  ...require("./shared")
});
