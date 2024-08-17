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
var ts2js_exports = {};
__export(ts2js_exports, {
  convertTsFilesToJs: () => convertTsFilesToJs,
  convertTsProjectToJs: () => convertTsProjectToJs,
  convertTsScriptsToJs: () => convertTsScriptsToJs,
  getPrettierConfig: () => getPrettierConfig,
  prettify: () => prettify,
  transformTSToJS: () => transformTSToJS,
  typeScriptSourceFiles: () => typeScriptSourceFiles
});
module.exports = __toCommonJS(ts2js_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_core = require("@babel/core");
var import_fast_glob = __toESM(require("fast-glob"));
var import_prettier = require("prettier");
var import_project_config = require("@redwoodjs/project-config");
const convertTsProjectToJs = (cwd = (0, import_project_config.getPaths)().base) => {
  const files = typeScriptSourceFiles(cwd);
  convertTsFilesToJs(cwd, files);
};
const convertTsScriptsToJs = (cwd = (0, import_project_config.getPaths)().base) => {
  const files = typeScriptSourceFiles(cwd, "scripts/*.{ts,tsx}");
  convertTsFilesToJs(cwd, files);
};
const convertTsFilesToJs = async (cwd, files) => {
  if (files.length === 0) {
    console.log("No TypeScript files found to convert to JS in this project.");
  }
  for (const f of files) {
    const code = await transformTSToJS(f);
    if (code) {
      import_fs.default.writeFileSync(
        import_path.default.join(cwd, f.replace(".tsx", ".jsx").replace(".ts", ".js")),
        code,
        "utf8"
      );
      import_fs.default.unlinkSync(import_path.default.join(cwd, f));
    }
  }
  if (import_fs.default.existsSync(import_path.default.join(cwd, "api/tsconfig.json"))) {
    import_fs.default.renameSync(
      import_path.default.join(cwd, "api/tsconfig.json"),
      import_path.default.join(cwd, "api/jsconfig.json")
    );
  }
  if (import_fs.default.existsSync(import_path.default.join(cwd, "web/tsconfig.json"))) {
    import_fs.default.renameSync(
      import_path.default.join(cwd, "web/tsconfig.json"),
      import_path.default.join(cwd, "web/jsconfig.json")
    );
  }
  if (import_fs.default.existsSync(import_path.default.join(cwd, "scripts/tsconfig.json"))) {
    import_fs.default.renameSync(
      import_path.default.join(cwd, "scripts/tsconfig.json"),
      import_path.default.join(cwd, "scripts/jsconfig.json")
    );
  }
};
const typeScriptSourceFiles = (cwd, globPattern = "{api,web}/src/**/*.{ts,tsx}") => {
  console.log(globPattern);
  return import_fast_glob.default.sync(globPattern, {
    cwd,
    ignore: ["node_modules"]
  });
};
const transformTSToJS = (file) => {
  const tsCode = import_fs.default.readFileSync(file, "utf8");
  const filename = import_path.default.basename(file);
  const result = (0, import_core.transform)(tsCode, {
    filename,
    cwd: (0, import_project_config.getPaths)().base,
    configFile: false,
    plugins: [
      [
        "@babel/plugin-transform-typescript",
        {
          isTSX: true,
          allExtensions: true
        }
      ]
    ],
    retainLines: true
  });
  if (!result?.code) {
    return void 0;
  }
  return prettify(result.code, filename.replace(/\.ts$/, ".js"));
};
const getPrettierConfig = async () => {
  try {
    const { default: prettierConfig } = await import(`file://${import_path.default.join((0, import_project_config.getPaths)().base, "prettier.config.js")}`);
    return prettierConfig;
  } catch {
    return void 0;
  }
};
const prettierParser = (filename) => {
  switch (import_path.default.extname(filename.replace(".template", ""))) {
    case ".css":
      return "css";
    case ".js":
      return "babel";
    case ".ts":
    case ".tsx":
      return "babel-ts";
    default:
      return void 0;
  }
};
const prettify = async (code, filename) => {
  const parser = prettierParser(filename);
  if (typeof parser === "undefined") {
    return code;
  }
  const prettierConfig = await getPrettierConfig();
  return (0, import_prettier.format)(code, {
    ...prettierConfig,
    parser
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  convertTsFilesToJs,
  convertTsProjectToJs,
  convertTsScriptsToJs,
  getPrettierConfig,
  prettify,
  transformTSToJS,
  typeScriptSourceFiles
});
