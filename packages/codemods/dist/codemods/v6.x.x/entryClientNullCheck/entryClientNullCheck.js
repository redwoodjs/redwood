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

  // Get the expected variable declaration
  const node = (0, _find.default)(ast).call(ast, j.VariableDeclaration, {
    declarations: [{
      id: {
        name: 'redwoodAppElement'
      }
    }]
  });

  // If it doesn't exist, bail out and let the user know
  if (node.length === 0) {
    console.warn("\nCould not find 'redwoodAppElement' variable declaration. Please make the necessary changes to your 'web/src/index.js' file manually.\n");
    return file.source;
  }

  // Insert the new null check
  node.insertAfter(j.ifStatement(j.unaryExpression('!', j.identifier('redwoodAppElement')), j.blockStatement([j.throwStatement(j.newExpression(j.identifier('Error'), [j.literal("Could not find an element with ID 'redwood-app'. Please ensure it exists in your 'web/src/index.html' file.")]))])));
  return ast.toSource();
}