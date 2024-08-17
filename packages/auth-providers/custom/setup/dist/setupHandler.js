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
  const authFilename = (0, _cliHelpers.isTypeScriptProject)() ? 'auth.ts' : 'auth.js';
  (0, _cliHelpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    provider: 'custom',
    webPackages: [`@redwoodjs/auth@${version}`],
    notes: ['Done! But you have a little more work to do.', "You'll have to write the actual implementation yourself.", `Take a look in ${authFilename}, and for a full walkthrough`, 'see https://redwoodjs.com/docs/auth/custom.']
  });
}