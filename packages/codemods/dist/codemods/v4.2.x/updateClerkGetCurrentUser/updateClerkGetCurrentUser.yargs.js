"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _path = _interopRequireDefault(require("path"));
var _tasuku = _interopRequireDefault(require("tasuku"));
var _projectConfig = require("@redwoodjs/project-config");
var _isTSProject = _interopRequireDefault(require("../../../lib/isTSProject"));
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'update-clerk-get-current-user';
const description = exports.description = '(v4.1.x->v4.2.x) For Clerk users; updates the getCurrentUser function';
const handler = () => {
  (0, _tasuku.default)('Update getCurrentUser', async ({
    setOutput
  }) => {
    const authFile = _isTSProject.default ? 'auth.ts' : 'auth.js';
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'updateClerkGetCurrentUser.js'),
      targetPaths: [_path.default.join((0, _projectConfig.getPaths)().api.base, 'src', 'lib', authFile)]
    });
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;