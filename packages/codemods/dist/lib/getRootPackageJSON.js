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
var getRootPackageJSON_exports = {};
__export(getRootPackageJSON_exports, {
  default: () => getRootPackageJSON_default
});
module.exports = __toCommonJS(getRootPackageJSON_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_project_config = require("@redwoodjs/project-config");
const getRootPackageJSON = () => {
  const rootPackageJSONPath = import_path.default.join((0, import_project_config.getPaths)().base, "package.json");
  const rootPackageJSON = JSON.parse(
    import_fs.default.readFileSync(rootPackageJSONPath, "utf8")
  );
  return [rootPackageJSON, rootPackageJSONPath];
};
var getRootPackageJSON_default = getRootPackageJSON;
