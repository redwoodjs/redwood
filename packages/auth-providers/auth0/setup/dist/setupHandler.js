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
  handler: () => handler
});
module.exports = __toCommonJS(setupHandler_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_cli_helpers = require("@redwoodjs/cli-helpers");
const { version } = JSON.parse(
  import_fs.default.readFileSync(import_path.default.resolve(__dirname, "../package.json"), "utf-8")
);
async function handler({ force: forceArg }) {
  (0, import_cli_helpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    provider: "auth0",
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-auth0-api'",
    apiPackages: [`@redwoodjs/auth-auth0-api@${version}`],
    webPackages: [
      "@auth0/auth0-spa-js@^2",
      `@redwoodjs/auth-auth0-web@${version}`
    ],
    notes: [
      "You'll need to add four env vars to your .env file:",
      "",
      '```bash title=".env"',
      'AUTH0_DOMAIN ="Domain"',
      'AUTH0_CLIENT_ID ="Client ID"',
      'AUTH0_REDIRECT_URI="http://localhost:8910"',
      'AUTH0_AUDIENCE="API Audience"',
      "```",
      "",
      "You can find their values on your Auth0 app's dashboard.",
      "Be sure to include them in the `includeEnvironmentVariables` array in redwood.toml:",
      "",
      '```toml title="redwood.toml"',
      "includeEnvironmentVariables = [",
      '  "AUTH0_DOMAIN",',
      '  "AUTH0_CLIENT_ID",',
      '  "AUTH0_REDIRECT_URI",',
      '  "AUTH0_AUDIENCE"',
      "]",
      "```",
      "",
      "Also see https://redwoodjs.com/docs/auth/auth0 for a full walkthrough."
    ]
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
