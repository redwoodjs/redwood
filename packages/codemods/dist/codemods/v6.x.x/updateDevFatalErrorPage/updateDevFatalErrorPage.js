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
var updateDevFatalErrorPage_exports = {};
__export(updateDevFatalErrorPage_exports, {
  updateDevFatalErrorPage: () => updateDevFatalErrorPage
});
module.exports = __toCommonJS(updateDevFatalErrorPage_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_fetch = require("@whatwg-node/fetch");
var import_project_config = require("@redwoodjs/project-config");
const updateDevFatalErrorPage = async () => {
  const rwPaths = (0, import_project_config.getPaths)();
  const webFatalErrorPagesDir = import_path.default.join(rwPaths.web.pages, "FatalErrorPage");
  const filename = import_path.default.join(webFatalErrorPagesDir, "FatalErrorPage");
  const url = "https://raw.githubusercontent.com/redwoodjs/redwood/29138f59dc5abe7b3d3c2a11c6e6f5fee32580c5/packages/create-redwood-app/templates/ts/web/src/pages/FatalErrorPage/FatalErrorPage.tsx";
  const isTsxPage = import_fs.default.existsSync(
    import_path.default.join(webFatalErrorPagesDir, "FatalErrorPage.tsx")
  );
  const isJsxPage = import_fs.default.existsSync(
    import_path.default.join(webFatalErrorPagesDir, "FatalErrorPage.jsx")
  );
  const ext = isTsxPage ? "tsx" : isJsxPage ? "jsx" : "js";
  const res = await (0, import_fetch.fetch)(url);
  const text = await res.text();
  const newFatalErrorPage = `${filename}.${ext}`;
  import_fs.default.writeFileSync(newFatalErrorPage, text);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateDevFatalErrorPage
});
