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
var authFiles_exports = {};
__export(authFiles_exports, {
  apiSideFiles: () => apiSideFiles,
  generateUniqueFileNames: () => generateUniqueFileNames
});
module.exports = __toCommonJS(authFiles_exports);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_pascalcase = __toESM(require("pascalcase"), 1);
var import_lib = require("../lib/index.js");
var import_paths = require("../lib/paths.js");
var import_project = require("../lib/project.js");
const apiSideFiles = async ({ basedir, webAuthn }) => {
  const apiSrcPath = (0, import_paths.getPaths)().api.src;
  const apiBaseTemplatePath = import_path.default.join(basedir, "templates", "api");
  const templateDirectories = import_fs.default.readdirSync(apiBaseTemplatePath);
  let filesRecord = {};
  for (const dir of templateDirectories) {
    const templateFiles = import_fs.default.readdirSync(import_path.default.join(apiBaseTemplatePath, dir));
    const filePaths = templateFiles.filter((fileName) => {
      const fileNameParts = fileName.split(".");
      return fileNameParts.length <= 3 || fileNameParts.at(-3) !== "webAuthn";
    }).map((fileName) => {
      let outputFileName = fileName.replace(/\.template$/, "");
      if (!(0, import_project.isTypeScriptProject)()) {
        outputFileName = outputFileName.replace(/\.ts(x?)$/, ".js$1");
      }
      if (!webAuthn) {
        return { templateFileName: fileName, outputFileName };
      }
      const webAuthnFileName = fileName.split(".").reverse().map((part, i) => i === 1 ? "webAuthn." + part : part).reverse().join(".");
      if (templateFiles.includes(webAuthnFileName)) {
        return { templateFileName: webAuthnFileName, outputFileName };
      } else {
        return { templateFileName: fileName, outputFileName };
      }
    }).map((f) => {
      const templateFilePath = import_path.default.join(
        apiBaseTemplatePath,
        dir,
        f.templateFileName
      );
      const outputFilePath = import_path.default.join(apiSrcPath, dir, f.outputFileName);
      return { templateFilePath, outputFilePath };
    });
    for (const paths of filePaths) {
      const content = import_fs.default.readFileSync(paths.templateFilePath, "utf8");
      filesRecord = {
        ...filesRecord,
        [paths.outputFilePath]: (0, import_project.isTypeScriptProject)() ? content : await (0, import_lib.transformTSToJS)(paths.outputFilePath, content)
      };
    }
  }
  return filesRecord;
};
function generateUniqueFileNames(filesRecord, provider) {
  const newFilesRecord = {};
  Object.keys(filesRecord).forEach((fullPath) => {
    let newFullPath = fullPath;
    let i = 1;
    while (import_fs.default.existsSync(newFullPath)) {
      const nameParts = import_path.default.basename(fullPath).split(".");
      if (nameParts[0] === provider) {
        const newFileName = provider + (i + 1) + "." + nameParts.slice(1).join(".");
        newFullPath = import_path.default.join(import_path.default.dirname(fullPath), newFileName);
      } else {
        const count = i > 1 ? i : "";
        const newFileName = provider + (0, import_pascalcase.default)(nameParts[0]) + count + "." + nameParts.slice(1).join(".");
        newFullPath = import_path.default.join(import_path.default.dirname(fullPath), newFileName);
      }
      i++;
    }
    newFilesRecord[newFullPath] = filesRecord[fullPath];
  });
  return newFilesRecord;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apiSideFiles,
  generateUniqueFileNames
});
