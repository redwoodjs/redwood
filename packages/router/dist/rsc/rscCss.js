import fs from "node:fs";
import path from "node:path";
import { getPaths } from "@redwoodjs/project-config";
function getRscStylesheetLinkGenerator(existingLinks) {
  const clientBuildManifestPath = path.join(
    getPaths().web.distBrowser,
    "client-build-manifest.json"
  );
  const clientBuildManifest = JSON.parse(
    fs.readFileSync(clientBuildManifestPath, "utf-8")
  );
  const clientCss = extractCssMappingFromManifest(clientBuildManifest);
  const serverBuildManifestPath = path.join(
    getPaths().web.distRsc,
    "server-build-manifest.json"
  );
  const serverBuildManifest = JSON.parse(
    fs.readFileSync(serverBuildManifestPath, "utf-8")
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
export {
  getRscStylesheetLinkGenerator
};
