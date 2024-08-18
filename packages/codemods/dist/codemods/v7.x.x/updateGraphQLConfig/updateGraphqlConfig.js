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
var updateGraphqlConfig_exports = {};
__export(updateGraphqlConfig_exports, {
  updateGraphqlConfig: () => updateGraphqlConfig
});
module.exports = __toCommonJS(updateGraphqlConfig_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_fetch = require("@whatwg-node/fetch");
var import_project_config = require("@redwoodjs/project-config");
const updateGraphqlConfig = async () => {
  const res = await (0, import_fetch.fetch)(
    // TODO: Have to come back here to update the URL when we have a more
    // stable location than main
    // 'https://raw.githubusercontent.com/redwoodjs/redwood/release/major/v7.0.0/packages/create-redwood-app/templates/ts/graphql.config.js'
    "https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/templates/ts/graphql.config.js"
  );
  const text = await res.text();
  import_fs.default.writeFileSync(import_path.default.join((0, import_project_config.getPaths)().base, "graphql.config.js"), text);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateGraphqlConfig
});
