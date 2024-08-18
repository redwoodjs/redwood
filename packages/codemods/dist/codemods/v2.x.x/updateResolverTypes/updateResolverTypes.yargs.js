"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _path = _interopRequireDefault(require("path"));
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _tasuku = _interopRequireDefault(require("tasuku"));
var _projectConfig = require("@redwoodjs/project-config");
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'update-resolver-types';
const description = exports.description = '(v2.x.x->v3.x.x) Wraps types for "relation" resolvers in the bottom of service files';
const handler = () => {
  (0, _tasuku.default)('Update Resolver Types', async ({
    setOutput
  }) => {
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'updateResolverTypes.js'),
      // Target services written in TS only
      targetPaths: _fastGlob.default.sync('**/*.ts', {
        cwd: (0, _projectConfig.getPaths)().api.services,
        ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.scenarios.ts'],
        absolute: true
      })
    });
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;