"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = handler;
require("core-js/modules/esnext.json.parse.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _cliHelpers = require("@redwoodjs/cli-helpers");
const {
  version
} = JSON.parse(_fs.default.readFileSync(_path.default.resolve(__dirname, '../package.json'), 'utf-8'));
async function handler({
  force: forceArg
}) {
  (0, _cliHelpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    provider: 'firebase',
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-firebase-api'",
    webPackages: ['firebase@^10', `@redwoodjs/auth-firebase-web@${version}`],
    apiPackages: [
    // Note that the version of this package should be exactly the same as the version in `@redwoodjs/auth-firebase-api` .
    'firebase-admin@12.1.1', `@redwoodjs/auth-firebase-api@${version}`],
    notes: ["You'll need to add three env vars to your .env file:", '', '```bash title=".env"', 'FIREBASE_API_KEY="..."', 'FIREBASE_AUTH_DOMAIN="..."', 'FIREBASE_PROJECT_ID="..."', '```', '', "You can find their values on your Firebase app's dashboard.", 'Be sure to include `FIREBASE_API_KEY` and `FIREBASE_AUTH_DOMAIN` in the `includeEnvironmentVariables` array in redwood.toml:', '', '```toml title="redwood.toml"', 'includeEnvironmentVariables = [', '  "FIREBASE_API_KEY",', '  "FIREBASE_AUTH_DOMAIN"', ']', '```', '', 'Also see https://redwoodjs.com/docs/auth/firebase for a full walkthrough.']
  });
}