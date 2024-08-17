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
    provider: 'supabase',
    authDecoderImport: `import { authDecoder } from '@redwoodjs/auth-supabase-api'`,
    apiPackages: [`@redwoodjs/auth-supabase-api@${version}`],
    webPackages: [`@redwoodjs/auth-supabase-web@${version}`, '@supabase/supabase-js@^2'],
    notes: ["You'll need to add two env vars to your .env file:", '', '```bash title=".env"', 'SUPABASE_URL="..."', 'SUPABASE_KEY="..."', 'SUPABASE_JWT_SECRET="..."', '```', '', "You can find their values on your Supabase app's dashboard.", 'Be sure to include them in the `includeEnvironmentVariables` array in redwood.toml:', '', '```toml title="redwood.toml"', 'includeEnvironmentVariables = [', '  "SUPABASE_URL",', '  "SUPABASE_KEY",', ']', '```', '', 'Also see https://redwoodjs.com/docs/auth/supabase for a full walkthrough.']
  });
};
exports.handler = handler;