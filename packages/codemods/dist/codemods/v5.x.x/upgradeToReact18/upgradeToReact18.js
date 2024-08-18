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
var upgradeToReact18_exports = {};
__export(upgradeToReact18_exports, {
  checkAndTransformReactRoot: () => checkAndTransformReactRoot,
  checkAndUpdateCustomWebIndex: () => checkAndUpdateCustomWebIndex,
  upgradeReactDepsTo18: () => upgradeReactDepsTo18
});
module.exports = __toCommonJS(upgradeToReact18_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_cheerio = require("cheerio");
var import_execa = __toESM(require("execa"));
var import_project_config = require("@redwoodjs/project-config");
function checkAndTransformReactRoot(taskContext) {
  const indexHTMLFilepath = import_path.default.join((0, import_project_config.getPaths)().web.src, "index.html");
  const indexHTML = (0, import_cheerio.load)(import_fs.default.readFileSync(indexHTMLFilepath, "utf-8"));
  const reactRoot = indexHTML("#redwood-app");
  const reactRootChildren = reactRoot.children();
  if (reactRootChildren.length) {
    let reactRootHTML = reactRoot.html();
    if (!reactRootHTML) {
      throw new Error(
        `Couldn't get HTML in react root (div with id="redwood-app")`
      );
    }
    reactRootHTML = reactRootHTML.replace("<!-- Please keep the line below for prerender support. -->", "").replace("&lt;%= prerenderPlaceholder %&gt;", "").split("\n").filter((line) => line.match(/\S/)).join("\n");
    taskContext.setWarning(
      [
        `The react root (<div id="redwood-app"></div>) in ${indexHTMLFilepath} has children:`,
        "",
        reactRootHTML,
        "",
        "React expects to control this DOM node completely. This codemod has moved the children outside the react root,",
        "but consider moving them into a layout."
      ].join("\n")
    );
  }
  indexHTML("body").append(reactRootChildren);
  reactRoot.text("");
  import_fs.default.writeFileSync(indexHTMLFilepath, indexHTML.html());
}
async function upgradeReactDepsTo18() {
  const redwoodProjectPaths = (0, import_project_config.getPaths)();
  const webPackageJSONPath = import_path.default.join(
    redwoodProjectPaths.web.base,
    "package.json"
  );
  const webPackageJSON = JSON.parse(
    import_fs.default.readFileSync(webPackageJSONPath, "utf-8")
  );
  const latestReactVersion = "18.2.0";
  for (const requiredReactDep of ["react", "react-dom"]) {
    if (!Object.hasOwn(webPackageJSON.dependencies, requiredReactDep)) {
      throw new Error(
        `Couldn't find ${requiredReactDep} in web/package.json dependencies`
      );
    }
    webPackageJSON.dependencies[requiredReactDep] = latestReactVersion;
  }
  import_fs.default.writeFileSync(webPackageJSONPath, JSON.stringify(webPackageJSON, null, 2));
  await import_execa.default.command("yarn install", {
    cwd: redwoodProjectPaths.base
  });
}
async function checkAndUpdateCustomWebIndex(taskContext) {
  const redwoodProjectPaths = (0, import_project_config.getPaths)();
  const bundlerToCustomWebIndex = {
    vite: import_path.default.join(redwoodProjectPaths.web.src, "entry-client.jsx"),
    webpack: import_path.default.join(redwoodProjectPaths.web.src, "index.js")
  };
  const customWebIndexFound = Object.entries(bundlerToCustomWebIndex).find(
    ([, filepath]) => import_fs.default.existsSync(filepath)
  );
  if (!customWebIndexFound) {
    return;
  }
  import_fs.default.writeFileSync(customWebIndexFound[1], customWebIndexTemplate);
  taskContext.setWarning(
    [
      `We updated the custom web index for you at ${customWebIndexFound[1]}.`,
      "  If you made manual changes to this file, you'll have to copy them over manually from the diff."
    ].join("\n")
  );
}
const customWebIndexTemplate = `import { hydrateRoot, createRoot } from 'react-dom/client'

import App from './App'
/**
 * When \`#redwood-app\` isn't empty then it's very likely that you're using
 * prerendering. So React attaches event listeners to the existing markup
 * rather than replacing it.
 * https://reactjs.org/docs/react-dom-client.html#hydrateroot
 */
const redwoodAppElement = document.getElementById('redwood-app')

if (redwoodAppElement.children?.length > 0) {
  hydrateRoot(redwoodAppElement, <App />)
} else {
  const root = createRoot(redwoodAppElement)
  root.render(<App />)
}
`;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkAndTransformReactRoot,
  checkAndUpdateCustomWebIndex,
  upgradeReactDepsTo18
});
