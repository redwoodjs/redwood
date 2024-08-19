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
var ssrModuleMap_exports = {};
__export(ssrModuleMap_exports, {
  moduleMap: () => moduleMap
});
module.exports = __toCommonJS(ssrModuleMap_exports);
var import_utils = require("./utils.js");
const moduleMap = new Proxy(
  {},
  {
    get(_target, filePath) {
      return new Proxy(
        {},
        {
          get(_target2, name) {
            filePath = (0, import_utils.makeFilePath)(filePath);
            const manifestEntry = {
              id: filePath,
              chunks: [filePath],
              name
            };
            return manifestEntry;
          }
        }
      );
    }
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  moduleMap
});
