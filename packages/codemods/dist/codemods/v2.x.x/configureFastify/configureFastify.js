"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
function transform(file, api) {
  var _context;
  const j = api.jscodeshift;
  const ast = j(file.source);
  (0, _forEach.default)(_context = (0, _find.default)(ast).call(ast, j.AssignmentExpression)).call(_context, path => {
    const lhs = path.value.left;
    const rhs = path.value.right;
    if (lhs && rhs.type === 'Identifier' && rhs.name === 'config') {
      j(path).replaceWith(j.expressionStatement(j.assignmentExpression('=', j.identifier('module.exports'), j.identifier('{ config }'))));
    }
  });
  return ast.toSource();
}