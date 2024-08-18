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
var verifiers_exports = {};
__export(verifiers_exports, {
  createVerifier: () => createVerifier
});
module.exports = __toCommonJS(verifiers_exports);
var import_common = require("./common");
__reExport(verifiers_exports, require("./common"), module.exports);
const createVerifier = (type, options) => {
  if (options) {
    return import_common.verifierLookup[type](options);
  } else {
    return import_common.verifierLookup[type]();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createVerifier,
  ...require("./common")
});
