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
    provider: "firebase",
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-firebase-api'",
    webPackages: ["firebase@^10", `@redwoodjs/auth-firebase-web@${version}`],
    apiPackages: [
      // Note that the version of this package should be exactly the same as the version in `@redwoodjs/auth-firebase-api` .
      "firebase-admin@12.1.1",
      `@redwoodjs/auth-firebase-api@${version}`
    ],
    notes: [
      "You'll need to add three env vars to your .env file:",
      "",
      '```bash title=".env"',
      'FIREBASE_API_KEY="..."',
      'FIREBASE_AUTH_DOMAIN="..."',
      'FIREBASE_PROJECT_ID="..."',
      "```",
      "",
      "You can find their values on your Firebase app's dashboard.",
      "Be sure to include `FIREBASE_API_KEY` and `FIREBASE_AUTH_DOMAIN` in the `includeEnvironmentVariables` array in redwood.toml:",
      "",
      '```toml title="redwood.toml"',
      "includeEnvironmentVariables = [",
      '  "FIREBASE_API_KEY",',
      '  "FIREBASE_AUTH_DOMAIN"',
      "]",
      "```",
      "",
      "Also see https://redwoodjs.com/docs/auth/firebase for a full walkthrough."
    ]
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
