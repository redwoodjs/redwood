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
    provider: 'netlify',
    authDecoderImport: `import { authDecoder } from '@redwoodjs/auth-netlify-api'`,
    apiPackages: [`@redwoodjs/auth-netlify-api@${version}`],
    webPackages: [`@redwoodjs/auth-netlify-web@${version}`, 'netlify-identity-widget@^1'],
    notes: ["You'll need to enable Identity on your Netlify site and configure the API endpoint locally.", 'See https://redwoodjs.com/docs/auth/netlify for a full walkthrough.']
  });
}