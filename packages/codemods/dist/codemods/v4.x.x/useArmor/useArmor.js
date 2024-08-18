"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _at = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/at"));
function transform(file, api) {
  var _context;
  const j = api.jscodeshift;
  const ast = j(file.source);

  // Within createGraphQLHandler, look for the `depthLimitOptions` option and replace it with `armorConfig`
  // and the original value of `maxDepth`
  (0, _forEach.default)(_context = (0, _find.default)(ast).call(ast, j.CallExpression, {
    callee: {
      name: 'createGraphQLHandler'
    }
  })).call(_context, path => {
    var _context2;
    const depthLimitOptionsProp = (0, _find.default)(_context2 = j(path.node)).call(_context2, j.ObjectProperty, {
      key: {
        name: 'depthLimitOptions'
      }
    });
    if (depthLimitOptionsProp.length > 0) {
      console.info(`Updating createGraphQLHandler config in ${file.path} ...`);
      const maxDepthProp = (0, _find.default)(depthLimitOptionsProp).call(depthLimitOptionsProp, j.ObjectProperty, {
        key: {
          name: 'maxDepth'
        }
      });
      const depthLimitOption = (0, _find.default)(maxDepthProp).call(maxDepthProp, j.Literal);
      if (depthLimitOption.length > 0) {
        const depthLimitOptionValue = (0, _at.default)(depthLimitOption).call(depthLimitOption, 0).get().value.value;
        depthLimitOptionsProp.replaceWith([j.identifier(`armorConfig: { maxDepth: { n: ${depthLimitOptionValue || 11} } }`)]);
        console.info(`useArmor configured to use existing maxDepth of ${depthLimitOptionValue || 11}.`);
      }
    } else {
      console.info(`No mods needed to createGraphQLHandler config in ${file.path}. Skipping...`);
    }
  });
  return ast.toSource({
    trailingComma: true,
    quote: 'single',
    lineTerminator: '\n'
  });
}