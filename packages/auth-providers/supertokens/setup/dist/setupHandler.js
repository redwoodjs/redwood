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
var setupHandler_exports = {};
__export(setupHandler_exports, {
  addRoutingLogic: () => addRoutingLogic,
  handler: () => handler
});
module.exports = __toCommonJS(setupHandler_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_cli_helpers = require("@redwoodjs/cli-helpers");
async function handler({ force: forceArg }) {
  const { version } = JSON.parse(
    import_fs.default.readFileSync(import_path.default.resolve(__dirname, "../package.json"), "utf-8")
  );
  (0, import_cli_helpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    provider: "supertokens",
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-supertokens-api'",
    apiPackages: [
      `@redwoodjs/auth-supertokens-api@${version}`,
      "supertokens-node@^15"
    ],
    webPackages: [
      `@redwoodjs/auth-supertokens-web@${version}`,
      "supertokens-auth-react@~0.34.0",
      "supertokens-web-js@~0.7.0"
    ],
    extraTasks: [addRoutingLogic],
    notes: [
      "We've implemented SuperToken's EmailPassword with Social / Enterprise (OAuth 2.0, SAML) login recipe,",
      "but feel free to switch to something that better fits your needs. See https://supertokens.com/docs/guides.",
      "",
      "To get things working, you'll need to add quite a few env vars to your .env file.",
      "See https://redwoodjs.com/docs/auth/supertokens for a full walkthrough."
    ]
  });
}
const addRoutingLogic = {
  title: `Adding SuperTokens routing logic to Routes.{jsx,tsx}...`,
  task: () => {
    const routesPath = (0, import_cli_helpers.getPaths)().web.routes;
    let content = import_fs.default.readFileSync(routesPath, "utf-8");
    content = content.replace("import SuperTokens from 'supertokens-auth-react'", "").replace(/if \(SuperTokens.canHandleRoute\(\)\) {[^}]+}/, "");
    if (!/\s*if\s*\(canHandleRoute\(PreBuiltUI\)\)\s*\{/.test(content)) {
      let hasImportedSuperTokensFunctions = false;
      content = content.split("\n").reduce((acc, line) => {
        if (!hasImportedSuperTokensFunctions && line.includes("import") && line.includes("@redwoodjs")) {
          acc.push(
            "import { canHandleRoute, getRoutingComponent } from 'supertokens-auth-react/ui'"
          );
          acc.push("");
          hasImportedSuperTokensFunctions = true;
        }
        acc.push(line);
        return acc;
      }, []).join("\n");
      content = content.replace(
        "import { useAuth } from './auth'",
        "import { useAuth, PreBuiltUI } from './auth'"
      );
      content = content.replace(
        /const Routes = \(\) => \{\n/,
        "const Routes = () => {\n  if (canHandleRoute(PreBuiltUI)) {\n    return getRoutingComponent(PreBuiltUI)\n  }\n\n"
      );
      import_fs.default.writeFileSync(routesPath, content);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addRoutingLogic,
  handler
});
