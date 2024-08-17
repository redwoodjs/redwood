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
var api_exports = {};
__export(api_exports, {
  buildApi: () => buildApi,
  cleanApiBuild: () => cleanApiBuild,
  rebuildApi: () => rebuildApi,
  transpileApi: () => transpileApi
});
module.exports = __toCommonJS(api_exports);
var import_esbuild = require("esbuild");
var import_fs_extra = __toESM(require("fs-extra"));
var import_babel_config = require("@redwoodjs/babel-config");
var import_project_config = require("@redwoodjs/project-config");
var import_files = require("../files");
let BUILD_CTX = null;
const buildApi = async () => {
  BUILD_CTX?.dispose();
  BUILD_CTX = null;
  return transpileApi((0, import_files.findApiFiles)());
};
const rebuildApi = async () => {
  const apiFiles = (0, import_files.findApiFiles)();
  if (!BUILD_CTX) {
    BUILD_CTX = await (0, import_esbuild.context)(getEsbuildOptions(apiFiles));
  }
  return BUILD_CTX.rebuild();
};
const cleanApiBuild = async () => {
  const rwjsPaths = (0, import_project_config.getPaths)();
  return import_fs_extra.default.remove(rwjsPaths.api.dist);
};
const runRwBabelTransformsPlugin = {
  name: "rw-esbuild-babel-transform",
  setup(build2) {
    const rwjsConfig = (0, import_project_config.getConfig)();
    build2.onLoad({ filter: /\.(js|ts|tsx|jsx)$/ }, async (args) => {
      const transformedCode = await (0, import_babel_config.transformWithBabel)(
        args.path,
        (0, import_babel_config.getApiSideBabelPlugins)({
          openTelemetry: rwjsConfig.experimental.opentelemetry.enabled && rwjsConfig.experimental.opentelemetry.wrapApi,
          projectIsEsm: (0, import_project_config.projectSideIsEsm)("api")
        })
      );
      if (transformedCode?.code) {
        return {
          contents: transformedCode.code,
          loader: "js"
        };
      }
      throw new Error(`Could not transform file: ${args.path}`);
    });
  }
};
const transpileApi = async (files) => {
  return (0, import_esbuild.build)(getEsbuildOptions(files));
};
function getEsbuildOptions(files) {
  const rwjsPaths = (0, import_project_config.getPaths)();
  const format = (0, import_project_config.projectSideIsEsm)("api") ? "esm" : "cjs";
  return {
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: "node",
    target: "node20",
    format,
    allowOverwrite: true,
    bundle: false,
    plugins: [runRwBabelTransformsPlugin],
    outdir: rwjsPaths.api.dist,
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildApi,
  cleanApiBuild,
  rebuildApi,
  transpileApi
});
