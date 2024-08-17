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
  buildApi: () => import_api.buildApi,
  generate: () => import_generate.generate,
  listQueryTypeFieldsInProject: () => import_gql.listQueryTypeFieldsInProject
});
module.exports = __toCommonJS(src_exports);
__reExport(src_exports, require("@redwoodjs/project-config"), module.exports);
__reExport(src_exports, require("./ts2js"), module.exports);
__reExport(src_exports, require("./dev"), module.exports);
__reExport(src_exports, require("./routes"), module.exports);
__reExport(src_exports, require("./files"), module.exports);
var import_generate = require("./generate/generate");
var import_api = require("./build/api");
__reExport(src_exports, require("./validateSchema"), module.exports);
__reExport(src_exports, require("@redwoodjs/babel-config"), module.exports);
var import_gql = require("./gql");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildApi,
  generate,
  listQueryTypeFieldsInProject,
  ...require("@redwoodjs/project-config"),
  ...require("./ts2js"),
  ...require("./dev"),
  ...require("./routes"),
  ...require("./files"),
  ...require("./validateSchema"),
  ...require("@redwoodjs/babel-config")
});
