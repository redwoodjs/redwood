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
const command = exports.command = 'update-theme-config';
const description = exports.description = '(v5.x.x->v6.x.x) Converts mantine and chakra UI configs to use ESM syntax';
const handler = () => {
  (0, _tasuku.default)('Update Theme Config', async ({
    setOutput
  }) => {
    const targetPaths = _fastGlob.default.sync('{chakra,mantine}.config.{js,jsx,tsx,ts}', {
      cwd: (0, _projectConfig.getPaths)().web.config,
      absolute: true
    });
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'updateThemeConfig.js'),
      targetPaths
    });
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;