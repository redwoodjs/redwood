"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _lastIndexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/last-index-of"));
var _fs = _interopRequireDefault(require("fs"));
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  const containsJSX = (0, _find.default)(ast).call(ast, j.JSXElement).length !== 0 || (0, _find.default)(ast).call(ast, j.JSXFragment).length !== 0 || (0, _find.default)(ast).call(ast, j.JSXText).length !== 0;
  if (containsJSX) {
    var _context;
    _fs.default.renameSync(file.path, file.path.substring(0, (0, _lastIndexOf.default)(_context = file.path).call(_context, '.')) + '.jsx');
  }

  // NOTE:
  // We deliberately don't return a value here, as we do not want to transform the source
  // See more here: https://github.com/facebook/jscodeshift
}