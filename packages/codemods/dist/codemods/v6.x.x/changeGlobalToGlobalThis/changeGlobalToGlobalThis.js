"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  (0, _find.default)(ast).call(ast, j.Identifier, {
    name: 'global'
  }).replaceWith(j.identifier('globalThis'));
  return ast.toSource();
}