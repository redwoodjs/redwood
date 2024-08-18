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
var updateThemeConfig_exports = {};
__export(updateThemeConfig_exports, {
  default: () => transform
});
module.exports = __toCommonJS(updateThemeConfig_exports);
function transform(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  root.find(j.AssignmentExpression, {
    left: {
      type: "MemberExpression",
      object: { type: "Identifier", name: "module" },
      property: { type: "Identifier", name: "exports" }
    }
  }).forEach((path) => {
    const configObject = path.value.right;
    let themeObjectName = "theme";
    if (j.Identifier.check(configObject)) {
      themeObjectName = configObject.name;
      j(path).remove();
    } else {
      const declaration = j.variableDeclaration("const", [
        j.variableDeclarator(j.identifier(themeObjectName), configObject)
      ]);
      j(path).replaceWith(declaration);
    }
    const exportDefaultStatement = j.exportDefaultDeclaration(
      j.identifier(themeObjectName)
    );
    j(path.parentPath).insertAfter(exportDefaultStatement);
  });
  return root.toSource();
}
