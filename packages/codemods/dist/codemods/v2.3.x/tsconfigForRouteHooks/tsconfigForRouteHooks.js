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
var tsconfigForRouteHooks_exports = {};
__export(tsconfigForRouteHooks_exports, {
  default: () => addApiAliasToTsConfig
});
module.exports = __toCommonJS(tsconfigForRouteHooks_exports);
var import_project_config = require("@redwoodjs/project-config");
var import_prettify = __toESM(require("../../../lib/prettify"));
async function addApiAliasToTsConfig() {
  const ts = await import("typescript");
  const webConfigPath = ts.findConfigFile(
    (0, import_project_config.getPaths)().web.base,
    ts.sys.fileExists
  );
  if (!webConfigPath) {
    throw new Error(
      "Could not find tsconfig.json in your web side. Please follow release notes to update your config manually."
    );
  }
  const { config: webConfig } = ts.parseConfigFileTextToJson(
    webConfigPath,
    ts.sys.readFile(webConfigPath)
    // If file exists, it has contents
  );
  if (webConfig?.compilerOptions) {
    const newPathAliases = {
      ...webConfig.compilerOptions.paths,
      "$api/*": ["../api/*"]
    };
    const updatedConfig = {
      ...webConfig,
      compilerOptions: {
        ...webConfig.compilerOptions,
        paths: newPathAliases
      }
    };
    ts.sys.writeFile(
      webConfigPath,
      // @NOTE: prettier will remove trailing commas, but whatever
      await (0, import_prettify.default)(JSON.stringify(updatedConfig), { parser: "json" })
    );
  } else {
    throw new Error(
      "Could not read your web/tsconfig.json. Please follow release notes to update your config manually."
    );
  }
}
