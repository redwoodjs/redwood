import path from "node:path";
import { getPaths } from "@redwoodjs/project-config";
import { getRscStylesheetLinkGenerator } from "./rscCss.js";
import { moduleMap } from "./ssrModuleMap.js";
import { importRsdwClient, importReact } from "./utils.js";
import { makeFilePath } from "./utils.js";
async function getEntries() {
  const entriesPath = getPaths().web.distRscEntries;
  const entries = await import(makeFilePath(entriesPath));
  return entries;
}
async function getRoutesComponent() {
  const { serverEntries } = await getEntries();
  const entryPath = path.join(
    getPaths().web.distRsc,
    serverEntries["__rwjs__Routes"]
  );
  console.log("getRoutesComponent entryPath", entryPath);
  const routesModule = await import(makeFilePath(entryPath));
  return routesModule.default;
}
function resolveClientEntryForProd(filePath, clientEntries) {
  const basePath = getPaths().web.distSsr;
  const entriesFile = getPaths().web.distRscEntries;
  const baseDir = path.dirname(entriesFile);
  const absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = path.join(baseDir, key);
      if (process.platform === "win32") {
        fullKey = fullKey.replaceAll("\\", "/");
      }
      return [fullKey, basePath + path.sep + val];
    })
  );
  const filePathSlash = filePath.replaceAll("\\", "/");
  const clientEntry = absoluteClientEntries[filePathSlash];
  console.log("resolveClientEntryForProd during SSR - filePath", clientEntry);
  if (!clientEntry) {
    if (absoluteClientEntries["*"] === "*") {
      return basePath + path.relative(getPaths().base, filePathSlash);
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
  const cssLinks = getRscStylesheetLinkGenerator()();
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
  const { createElement } = await importReact();
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
  const { createFromReadableStream } = await importRsdwClient();
  const data = createFromReadableStream(stream, {
    ssrManifest: { moduleMap, moduleLoading: null }
  });
  rscCache.set(pathname, data);
  return data;
}
export {
  renderRoutesFromDist
};
