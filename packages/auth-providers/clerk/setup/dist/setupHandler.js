"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = void 0;
require("core-js/modules/esnext.json.parse.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _cliHelpers = require("@redwoodjs/cli-helpers");
const {
  version
} = JSON.parse(_fs.default.readFileSync(_path.default.resolve(__dirname, '../package.json'), 'utf-8'));
const handler = async ({
  force: forceArg
}) => {
  (0, _cliHelpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    authDecoderImport: `import { clerkAuthDecoder as authDecoder } from '@redwoodjs/auth-clerk-api'`,
    provider: 'clerk',
    webPackages: ['@clerk/clerk-react@^4', `@redwoodjs/auth-clerk-web@${version}`],
    apiPackages: [`@redwoodjs/auth-clerk-api@${version}`],
    notes: ["You'll need to add two env vars to your .env file:", '', '```title=".env"', 'CLERK_PUBLISHABLE_KEY="..."', 'CLERK_SECRET_KEY="..."', '```', '', `You can find their values under "API Keys" on your Clerk app's dashboard.`, 'Be sure to include `CLERK_PUBLISHABLE_KEY` in the `includeEnvironmentVariables` array in redwood.toml.', '', '```toml title="redwood.toml"', 'includeEnvironmentVariables = [', '  "CLERK_PUBLISHABLE_KEY"', ']', '```', '', 'Also see https://redwoodjs.com/docs/auth/clerk for a full walkthrough.']
  });
};
exports.handler = handler;