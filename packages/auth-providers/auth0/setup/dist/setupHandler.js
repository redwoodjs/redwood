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
    provider: 'auth0',
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-auth0-api'",
    apiPackages: [`@redwoodjs/auth-auth0-api@${version}`],
    webPackages: ['@auth0/auth0-spa-js@^2', `@redwoodjs/auth-auth0-web@${version}`],
    notes: ["You'll need to add four env vars to your .env file:", '', '```bash title=".env"', 'AUTH0_DOMAIN ="Domain"', 'AUTH0_CLIENT_ID ="Client ID"', 'AUTH0_REDIRECT_URI="http://localhost:8910"', 'AUTH0_AUDIENCE="API Audience"', '```', '', "You can find their values on your Auth0 app's dashboard.", 'Be sure to include them in the `includeEnvironmentVariables` array in redwood.toml:', '', '```toml title="redwood.toml"', 'includeEnvironmentVariables = [', '  "AUTH0_DOMAIN",', '  "AUTH0_CLIENT_ID",', '  "AUTH0_REDIRECT_URI",', '  "AUTH0_AUDIENCE"', ']', '```', '', 'Also see https://redwoodjs.com/docs/auth/auth0 for a full walkthrough.']
  });
}