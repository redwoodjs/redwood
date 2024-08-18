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
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'convert-js-to-jsx';
const description = exports.description = '(v5.x.x->v6.x.x) Converts web components from .js to .jsx';
const handler = () => {
  (0, _tasuku.default)('Convert Js To Jsx', async ({
    setOutput
  }) => {
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'convertJsToJsx.js'),
      // All files in web/src that are .js
      targetPaths: _fastGlob.default.sync('web/src/**/*.js')
    });
    setOutput('All done! Your file contents have not been changed just the extension.');
  });
};
exports.handler = handler;