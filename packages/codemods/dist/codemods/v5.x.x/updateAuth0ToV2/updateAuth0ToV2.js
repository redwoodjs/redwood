"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  const paths = (0, _find.default)(ast).call(ast, j.ObjectProperty, node => {
    var _context;
    return (0, _includes.default)(_context = ['redirect_uri', 'audience']).call(_context, node.key.name);
  });
  let nodes = paths.nodes();
  nodes = (0, _map.default)(nodes).call(nodes, node => {
    const {
      comments: _comments,
      ...rest
    } = node;
    return rest;
  });
  paths.remove();
  (0, _find.default)(ast).call(ast, j.ObjectProperty, {
    key: {
      name: 'client_id'
    }
  }).insertAfter(j.objectProperty(j.identifier('authorizationParams'), j.objectExpression(nodes)));
  (0, _find.default)(ast).call(ast, j.Identifier, {
    name: 'client_id'
  }).replaceWith('clientId');
  return ast.toSource({
    trailingComma: true,
    quote: 'single',
    lineTerminator: '\n'
  });
}