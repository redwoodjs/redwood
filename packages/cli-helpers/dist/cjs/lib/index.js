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
var lib_exports = {};
__export(lib_exports, {
  getPrettierOptions: () => getPrettierOptions,
  prettify: () => prettify,
  transformTSToJS: () => transformTSToJS,
  writeFile: () => writeFile,
  writeFilesTask: () => writeFilesTask
});
module.exports = __toCommonJS(lib_exports);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var babel = __toESM(require("@babel/core"), 1);
var import_listr2 = require("listr2");
var import_prettier = require("prettier");
var import_colors = require("./colors.js");
var import_paths = require("./paths.js");
const transformTSToJS = (filename, content) => {
  if (!content) {
    return content;
  }
  const babelFileResult = babel.transform(content, {
    filename,
    // If you ran `yarn rw generate` in `./web` transformSync would import the `.babelrc.js` file,
    // in `./web`? despite us setting `configFile: false`.
    cwd: process.env.NODE_ENV === "test" ? void 0 : (0, import_paths.getPaths)().base,
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
  if (!babelFileResult?.code) {
    console.error(import_colors.colors.error(`Could not transform ${filename} to JS`));
    process.exit(1);
  }
  return prettify(filename.replace(/\.ts(x)?$/, ".js$1"), babelFileResult.code);
};
const getPrettierOptions = async () => {
  try {
    const { default: options } = await import(`file://${import_path.default.join((0, import_paths.getPaths)().base, "prettier.config.js")}`);
    if (options.tailwindConfig?.startsWith(".")) {
      options.tailwindConfig = import_path.default.join(
        process.env.RWJS_CWD ?? process.cwd(),
        options.tailwindConfig
      );
    }
    return options;
  } catch {
    return void 0;
  }
};
const prettify = async (templateFilename, renderedTemplate) => {
  const parser = {
    ".css": "css",
    ".js": "babel",
    ".ts": "babel-ts",
    ".tsx": "babel-ts"
  }[import_path.default.extname(templateFilename.replace(".template", ""))];
  if (typeof parser === "undefined") {
    return renderedTemplate;
  }
  const prettierOptions = await getPrettierOptions();
  return (0, import_prettier.format)(renderedTemplate, {
    ...prettierOptions,
    parser
  });
};
const writeFile = (target, contents, { existingFiles = "FAIL" } = {}, task = {}) => {
  const { base } = (0, import_paths.getPaths)();
  task.title = `Writing \`./${import_path.default.relative(base, target)}\``;
  const exists = import_fs.default.existsSync(target);
  if (exists && existingFiles === "FAIL") {
    throw new Error(`${target} already exists.`);
  }
  if (exists && existingFiles === "SKIP") {
    task.skip(`Skipping update of \`./${import_path.default.relative(base, target)}\``);
    return;
  }
  const filename = import_path.default.basename(target);
  const targetDir = target.replace(filename, "");
  import_fs.default.mkdirSync(targetDir, { recursive: true });
  import_fs.default.writeFileSync(target, contents);
  task.title = `Successfully wrote file \`./${import_path.default.relative(base, target)}\``;
};
const writeFilesTask = (files, options) => {
  const { base } = (0, import_paths.getPaths)();
  return new import_listr2.Listr(
    Object.keys(files).map((file) => {
      const contents = files[file];
      return {
        title: `...waiting to write file \`./${import_path.default.relative(base, file)}\`...`,
        task: (_ctx, task) => {
          return writeFile(file, contents, options, task);
        }
      };
    })
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPrettierOptions,
  prettify,
  transformTSToJS,
  writeFile,
  writeFilesTask
});
