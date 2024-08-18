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
var _getFilesWithPattern = _interopRequireDefault(require("../../../lib/getFilesWithPattern"));
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'rename-validate-with';
const description = exports.description = '(v4.x.x->v5.x.x) Renames validateWith to validateWithSync';
const handler = () => {
  (0, _tasuku.default)('Renaming `validateWith` to `validateWithSync`', async ({
    setOutput
  }) => {
    const redwoodProjectPaths = (0, _projectConfig.getPaths)();
    const files = (0, _getFilesWithPattern.default)({
      pattern: 'validateWith',
      filesToSearch: [redwoodProjectPaths.api.src]
    });
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'renameValidateWith.js'),
      targetPaths: files
    });
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;