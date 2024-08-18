"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
require("core-js/modules/es.array.push.js");
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _at = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/at"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
// We need to check all of the cell functions
const cellFunctionsToCheck = ['Success', 'Failure', 'Loading', 'Empty'];

// The list of properties which are no longer being spread
// See https://www.apollographql.com/docs/react/data/queries/#result for apollo query result properties
const nonSpreadVariables = ['previousData', 'variables', 'networkStatus', 'client', 'called', 'refetch', 'fetchMore', 'startPolling', 'stopPolling', 'subscribeToMore', 'updateQuery'];
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  (0, _forEach.default)(cellFunctionsToCheck).call(cellFunctionsToCheck, variableName => {
    const foundCellFunctions = ast.findVariableDeclarators(variableName);
    if (foundCellFunctions.size() === 1) {
      const foundFunction = foundCellFunctions.get();

      // We expect the variable to be a function (standard or arrow)
      if (foundFunction.value.init.type === 'ArrowFunctionExpression' || foundFunction.value.init.type === 'FunctionExpression') {
        var _context;
        const firstParameter = (0, _at.default)(_context = foundFunction.value.init.params).call(_context, 0);

        // No parameters taken by the function
        if (!firstParameter) {
          // Do nothing...
        } else {
          // We expect the function to be destructuring the properties the cell is passed
          if (firstParameter.type === 'ObjectPattern') {
            var _context2;
            const previouslySpreadPropertiesInUse = (0, _filter.default)(_context2 = firstParameter.properties).call(_context2, property => {
              // skip rest params
              if (property.type === 'RestElement') {
                return false;
              }
              return (0, _includes.default)(nonSpreadVariables).call(nonSpreadVariables, property.key.name);
            });
            if (previouslySpreadPropertiesInUse.length > 0) {
              var _context3;
              // Add the newly destructured properties as function parameters
              firstParameter.properties.push(j.property('init', j.identifier('queryResult'),
              // Previously spead properties are now found within 'queryResult'
              j.objectPattern(
              // For every previously spead property in use add a destructuring
              (0, _map.default)(previouslySpreadPropertiesInUse).call(previouslySpreadPropertiesInUse, usedProperty => {
                if (usedProperty.key.type !== 'Identifier' || usedProperty.value.type !== 'Identifier') {
                  throw new Error('Unable to process a parameter within the cell function');
                }
                const prop = j.property('init', j.identifier(usedProperty.key.name), j.identifier(usedProperty.value.name));
                // Use an alias if one was previously defined by the user
                prop.shorthand = usedProperty.shorthand;
                return prop;
              }))));
              // Remove the existing function parameters corresponding to previously spread variables
              firstParameter.properties = (0, _filter.default)(_context3 = firstParameter.properties).call(_context3, property => {
                if (property.key.type !== 'Identifier') {
                  throw new Error('Unable to process a parameter');
                }
                return !(0, _includes.default)(nonSpreadVariables).call(nonSpreadVariables, property.key.name);
              });
            }
          } else {
            console.warn(`The first parameter to '${variableName}' was not an object and we could not process this.`);
          }
        }
      } else {
        console.warn(`'${variableName}' is not a function and we could not process this.`);
      }
    } else {
      console.warn(`Could not find a unique '${variableName}' variable`);
    }
  });
  return ast.toSource({
    trailingComma: true,
    quote: 'single',
    lineTerminator: '\n'
  });
}