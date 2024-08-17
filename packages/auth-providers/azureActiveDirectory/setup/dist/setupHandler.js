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
    provider: 'azureActiveDirectory',
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-azure-active-directory-api'",
    apiPackages: [`@redwoodjs/auth-azure-active-directory-api@${version}`],
    webPackages: [`@redwoodjs/auth-azure-active-directory-web@${version}`, '@azure/msal-browser@^2'],
    notes: ["You'll need to add four env vars to your .env file:", '', '```bash title=".env"', 'AZURE_ACTIVE_DIRECTORY_CLIENT_ID="..."', `# Where \`tenantId\` is your app's "Directory (tenant) ID"`, 'AZURE_ACTIVE_DIRECTORY_AUTHORITY="https://login.microsoftonline.com/${tenantId}}"', 'AZURE_ACTIVE_DIRECTORY_REDIRECT_URI="http://localhost:8910"', 'AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI="http://localhost:8910/login"', '```', '', "You can find their values on your Azure app's dashboard.", 'Be sure to include them in the `includeEnvironmentVariables` array in redwood.toml:', '', '```toml title="redwood.toml"', 'includeEnvironmentVariables = [', '  "AZURE_ACTIVE_DIRECTORY_CLIENT_ID",', '  "AZURE_ACTIVE_DIRECTORY_AUTHORITY",', '  "AZURE_ACTIVE_DIRECTORY_REDIRECT_URI",', '  "AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI"', ']', '```', '', 'Also see https://redwoodjs.com/docs/auth/azure for a full walkthrough.']
  });
}