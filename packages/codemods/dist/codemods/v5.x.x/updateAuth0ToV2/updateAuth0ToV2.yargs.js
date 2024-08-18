"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _path = _interopRequireDefault(require("path"));
var _execa = _interopRequireDefault(require("execa"));
var _tasuku = _interopRequireDefault(require("tasuku"));
var _projectConfig = require("@redwoodjs/project-config");
var _isTSProject = _interopRequireDefault(require("../../../lib/isTSProject"));
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'update-auth0-to-v2';
const description = exports.description = '(v4.x.x->v5.x.x) Updates the web-side auth.{ts,js} file to the v2 SDK';
const handler = () => {
  (0, _tasuku.default)('Updating Auth0 to v2', async ({
    setOutput
  }) => {
    const authFile = _isTSProject.default ? 'auth.ts' : 'auth.js';
    try {
      await _execa.default.command('yarn up @auth0/auth0-spa-js@^2', {
        cwd: (0, _projectConfig.getPaths)().web.base
      });
    } catch {
      console.error("Couldn't update @auth0/auth0-spa-js; you'll have to upgrade it manually to the latest v2.x.x version");
    }
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'updateAuth0ToV2.js'),
      targetPaths: [_path.default.join((0, _projectConfig.getPaths)().web.src, authFile)]
    });
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;