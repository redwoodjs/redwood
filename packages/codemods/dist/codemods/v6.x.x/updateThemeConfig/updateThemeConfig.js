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

  // Find all module.exports assignments
  (0, _forEach.default)(_context = (0, _find.default)(root).call(root, j.AssignmentExpression, {
    left: {
      type: 'MemberExpression',
      object: {
        type: 'Identifier',
        name: 'module'
      },
      property: {
        type: 'Identifier',
        name: 'exports'
      }
    }
  })).call(_context, path => {
    const configObject = path.value.right;
    let themeObjectName = 'theme';
    if (j.Identifier.check(configObject)) {
      // If it already is an identifier, reuse it
      // modules.exports = theme -> export default theme
      // Note that export default statement is added outside this if statement
      themeObjectName = configObject.name;

      // Remove module.exports assignment
      j(path).remove();
    } else {
      // Create const declaration with the exported object
      const declaration = j.variableDeclaration('const', [j.variableDeclarator(j.identifier(themeObjectName), configObject)]);

      // Replace module.exports assignment with the const declaration
      // module.exports = {...} -> const theme = {...}
      j(path).replaceWith(declaration);
    }

    // Add export default statement
    const exportDefaultStatement = j.exportDefaultDeclaration(j.identifier(themeObjectName));
    j(path.parentPath).insertAfter(exportDefaultStatement);
  });
  return root.toSource();
}