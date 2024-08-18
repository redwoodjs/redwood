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
  const root = j(file.source);
  (0, _forEach.default)(_context = (0, _find.default)(root).call(root, j.MemberExpression, {
    object: {
      type: 'MemberExpression',
      object: {
        name: 'process'
      },
      property: {
        name: 'env'
      }
    }
  })).call(_context, path => {
    const envVarName = path.value.property;

    // Only apply the codemod if process.env['bbb']
    // where bbb is the string literal. Otherwise it catches process.env.bbb too
    if (j.StringLiteral.check(envVarName)) {
      const dotNotation = j.memberExpression(j.memberExpression(j.identifier('process'), j.identifier('env')), j.identifier(envVarName.value));
      j(path).replaceWith(dotNotation);
    }
  });
  return root.toSource();
}