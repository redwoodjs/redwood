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
var rscCss_exports = {};
__export(rscCss_exports, {
  getRscStylesheetLinkGenerator: () => getRscStylesheetLinkGenerator
});
module.exports = __toCommonJS(rscCss_exports);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_project_config = require("@redwoodjs/project-config");
function getRscStylesheetLinkGenerator(existingLinks) {
  const clientBuildManifestPath = import_node_path.default.join(
    (0, import_project_config.getPaths)().web.distBrowser,
    "client-build-manifest.json"
  );
  const clientBuildManifest = JSON.parse(
    import_node_fs.default.readFileSync(clientBuildManifestPath, "utf-8")
  );
  const clientCss = extractCssMappingFromManifest(clientBuildManifest);
  const serverBuildManifestPath = import_node_path.default.join(
    (0, import_project_config.getPaths)().web.distRsc,
    "server-build-manifest.json"
  );
  const serverBuildManifest = JSON.parse(
    import_node_fs.default.readFileSync(serverBuildManifestPath, "utf-8")
  );
  const serverCss = extractCssMappingFromManifest(serverBuildManifest);
  const allCss = /* @__PURE__ */ new Set();
  for (const cssList of clientCss.values()) {
    for (const css of cssList) {
      allCss.add(css);
    }
  }
  for (const cssList of serverCss.values()) {
    for (const css of cssList) {
      allCss.add(css);
    }
  }
  const cssLinks = Array.from(allCss);
  return () => [...existingLinks || [], ...cssLinks];
}
function extractCssMappingFromManifest(manifest) {
  const manifestCss = /* @__PURE__ */ new Map();
  const lookupCssAssets = (id) => {
    const assets = [];
    const asset = manifest[id];
    if (!asset) {
      return assets;
    }
    if (asset.css) {
      assets.push(...asset.css);
    }
    if (asset.imports) {
      for (const importId of asset.imports) {
        assets.push(...lookupCssAssets(importId));
      }
    }
    return assets;
  };
  for (const key of Object.keys(manifest)) {
    manifestCss.set(key, lookupCssAssets(key));
  }
  return manifestCss;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getRscStylesheetLinkGenerator
});
