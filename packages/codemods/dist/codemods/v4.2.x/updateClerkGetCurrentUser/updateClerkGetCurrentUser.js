"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
require("core-js/modules/es.array.push.js");
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
const newReturn = `userWithoutPrivateMetadata`;
const destructureStatement = `const { privateMetadata, ...${newReturn} } = decoded`;
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);

  // Insert `const { privateMetadata, ...userWithoutPrivateMetadata } = decoded` after `const { roles } = parseJWT({ decoded })`
  //
  // So, before...
  //
  // ```ts
  // const { roles } = parseJWT({ decoded })
  // ```
  //
  // and after...
  //
  // ```ts
  // const { roles } = parseJWT({ decoded })
  //
  // const { privateMetadata, ...userWithoutPrivateMetadata } = decoded
  // ```
  const parseJWTStatement = (0, _find.default)(ast).call(ast, j.VariableDeclaration, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'CallExpression',
        callee: {
          name: 'parseJWT'
        }
      }
    }]
  });
  parseJWTStatement.insertAfter(destructureStatement);

  // Swap `decoded` with `userWithoutPrivateMetadata` in the two return statements
  (0, _find.default)(ast).call(ast, j.ReturnStatement, {
    argument: {
      type: 'ObjectExpression',
      properties: [{
        type: 'SpreadElement',
        argument: {
          name: 'decoded'
        }
      }]
    }
  }).replaceWith(path => {
    var _context;
    const properties = (0, _filter.default)(_context = path.value.argument.properties).call(_context, property => property.type !== 'SpreadElement' && property.name !== 'decoded');
    properties.push(j.spreadElement(j.identifier(newReturn)));
    return j.returnStatement(j.objectExpression(properties));
  });
  return ast.toSource({
    trailingComma: true,
    quote: 'single',
    lineTerminator: '\n'
  });
}