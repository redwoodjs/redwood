"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var useArmor_exports = {};
__export(useArmor_exports, {
  default: () => transform
});
module.exports = __toCommonJS(useArmor_exports);
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  ast.find(j.CallExpression, { callee: { name: "createGraphQLHandler" } }).forEach((path) => {
    const depthLimitOptionsProp = j(path.node).find(j.ObjectProperty, {
      key: {
        name: "depthLimitOptions"
      }
    });
    if (depthLimitOptionsProp.length > 0) {
      console.info(`Updating createGraphQLHandler config in ${file.path} ...`);
      const maxDepthProp = depthLimitOptionsProp.find(j.ObjectProperty, {
        key: {
          name: "maxDepth"
        }
      });
      const depthLimitOption = maxDepthProp.find(j.Literal);
      if (depthLimitOption.length > 0) {
        const depthLimitOptionValue = depthLimitOption.at(0).get().value.value;
        depthLimitOptionsProp.replaceWith([
          j.identifier(
            `armorConfig: { maxDepth: { n: ${depthLimitOptionValue || 11} } }`
          )
        ]);
        console.info(
          `useArmor configured to use existing maxDepth of ${depthLimitOptionValue || 11}.`
        );
      }
    } else {
      console.info(
        `No mods needed to createGraphQLHandler config in ${file.path}. Skipping...`
      );
    }
  });
  return ast.toSource({
    trailingComma: true,
    quote: "single",
    lineTerminator: "\n"
  });
}
