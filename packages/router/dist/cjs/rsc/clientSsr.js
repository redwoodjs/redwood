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
var clientSsr_exports = {};
__export(clientSsr_exports, {
  renderRoutesFromDist: () => renderRoutesFromDist
});
module.exports = __toCommonJS(clientSsr_exports);
var import_node_path = __toESM(require("node:path"), 1);
var import_project_config = require("@redwoodjs/project-config");
var import_rscCss = require("./rscCss.js");
var import_ssrModuleMap = require("./ssrModuleMap.js");
var import_utils = require("./utils.js");
var import_utils2 = require("./utils.js");
async function getEntries() {
  const entriesPath = (0, import_project_config.getPaths)().web.distRscEntries;
  const entries = await import((0, import_utils2.makeFilePath)(entriesPath));
  return entries;
}
async function getRoutesComponent() {
  const { serverEntries } = await getEntries();
  const entryPath = import_node_path.default.join(
    (0, import_project_config.getPaths)().web.distRsc,
    serverEntries["__rwjs__Routes"]
  );
  console.log("getRoutesComponent entryPath", entryPath);
  const routesModule = await import((0, import_utils2.makeFilePath)(entryPath));
  return routesModule.default;
}
function resolveClientEntryForProd(filePath, clientEntries) {
  const basePath = (0, import_project_config.getPaths)().web.distSsr;
  const entriesFile = (0, import_project_config.getPaths)().web.distRscEntries;
  const baseDir = import_node_path.default.dirname(entriesFile);
  const absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = import_node_path.default.join(baseDir, key);
      if (process.platform === "win32") {
        fullKey = fullKey.replaceAll("\\", "/");
      }
      return [fullKey, basePath + import_node_path.default.sep + val];
    })
  );
  const filePathSlash = filePath.replaceAll("\\", "/");
  const clientEntry = absoluteClientEntries[filePathSlash];
  console.log("resolveClientEntryForProd during SSR - filePath", clientEntry);
  if (!clientEntry) {
    if (absoluteClientEntries["*"] === "*") {
      return basePath + import_node_path.default.relative((0, import_project_config.getPaths)().base, filePathSlash);
    }
    throw new Error("No client entry found for " + filePathSlash);
  }
  return clientEntry;
}
const rscCache = /* @__PURE__ */ new Map();
async function renderRoutesFromDist(pathname) {
  console.log("renderRoutesFromDist pathname", pathname);
  const cached = rscCache.get(pathname);
  if (cached) {
    return cached;
  }
  const cssLinks = (0, import_rscCss.getRscStylesheetLinkGenerator)()();
  const Routes = await getRoutesComponent();
  console.log("clientSsr.ts getEntries()", await getEntries());
  const clientEntries = (await getEntries()).ssrEntries;
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId) {
        console.log("Proxy get encodedId", encodedId);
        const [filePath, name] = encodedId.split("#");
        const id = resolveClientEntryForProd(filePath, clientEntries);
        console.log("clientSsr.ts::Proxy id", id);
        return { id, chunks: [id], name, async: true };
      }
    }
  );
  const { createElement } = await (0, import_utils.importReact)();
  const dynamicImport = "";
  const { renderToReadableStream } = await import(
    /* @vite-ignore */
    dynamicImport + "react-server-dom-webpack/server.edge"
  );
  console.log("clientSsr.ts right before renderToReadableStream");
  const stream = renderToReadableStream(
    // createElement(layout, undefined, createElement(page, props)),
    createElement(Routes, {
      // TODO (RSC): Include a more complete location object here. At least
      // search params as well
      // TODO (RSC): Get rid of this when the router can just use
      // useLocation()
      location: { pathname },
      css: cssLinks
    }),
    bundlerConfig
  );
  const { createFromReadableStream } = await (0, import_utils.importRsdwClient)();
  const data = createFromReadableStream(stream, {
    ssrManifest: { moduleMap: import_ssrModuleMap.moduleMap, moduleLoading: null }
  });
  rscCache.set(pathname, data);
  return data;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  renderRoutesFromDist
});
