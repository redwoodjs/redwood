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
  prismaVersion: () => prismaVersion,
  redwoodVersion: () => redwoodVersion
});
module.exports = __toCommonJS(src_exports);
__reExport(src_exports, require("./auth"), module.exports);
__reExport(src_exports, require("./errors"), module.exports);
__reExport(src_exports, require("./validations/validations"), module.exports);
__reExport(src_exports, require("./validations/errors"), module.exports);
__reExport(src_exports, require("./types"), module.exports);
__reExport(src_exports, require("./transforms"), module.exports);
__reExport(src_exports, require("./cors"), module.exports);
__reExport(src_exports, require("./event"), module.exports);
const packageJson = require("../package.json");
const prismaVersion = packageJson?.dependencies["@prisma/client"];
const redwoodVersion = packageJson?.version;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  prismaVersion,
  redwoodVersion,
  ...require("./auth"),
  ...require("./errors"),
  ...require("./validations/validations"),
  ...require("./validations/errors"),
  ...require("./types"),
  ...require("./transforms"),
  ...require("./cors"),
  ...require("./event")
});
