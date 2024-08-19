import path from "node:path";
import { pathToFileURL } from "node:url";
import { getPaths } from "@redwoodjs/project-config";
function makeFilePath(path2) {
  return pathToFileURL(path2).href;
}
async function importReact() {
  const distSsr = getPaths().web.distSsr;
  const reactPath = makeFilePath(path.join(distSsr, "__rwjs__react.mjs"));
  return (await import(reactPath)).default;
}
async function importRsdwClient() {
  const distSsr = getPaths().web.distSsr;
  const rsdwClientPath = makeFilePath(
    path.join(distSsr, "__rwjs__rsdw-client.mjs")
  );
  return (await import(rsdwClientPath)).default;
}
export {
  importReact,
  importRsdwClient,
  makeFilePath
};
