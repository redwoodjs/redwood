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
const command = exports.command = 'process-env-dot-notation';
const description = exports.description = '(v6.x.x->v6.x.x) Converts world to bazinga';
const handler = () => {
  (0, _tasuku.default)('Process Env Dot Notation', async ({
    setOutput
  }) => {
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'processEnvDotNotation.js'),
      targetPaths: _fastGlob.default.sync('**/*.{js,jsx,tsx}', {
        cwd: (0, _projectConfig.getPaths)().web.src,
        absolute: true
      })
    });
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;