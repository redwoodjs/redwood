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
var updateClerkGetCurrentUser_exports = {};
__export(updateClerkGetCurrentUser_exports, {
  default: () => transform
});
module.exports = __toCommonJS(updateClerkGetCurrentUser_exports);
const newReturn = `userWithoutPrivateMetadata`;
const destructureStatement = `const { privateMetadata, ...${newReturn} } = decoded`;
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  const parseJWTStatement = ast.find(j.VariableDeclaration, {
    declarations: [
      {
        type: "VariableDeclarator",
        init: {
          type: "CallExpression",
          callee: {
            name: "parseJWT"
          }
        }
      }
    ]
  });
  parseJWTStatement.insertAfter(destructureStatement);
  ast.find(j.ReturnStatement, {
    argument: {
      type: "ObjectExpression",
      properties: [
        {
          type: "SpreadElement",
          argument: {
            name: "decoded"
          }
        }
      ]
    }
  }).replaceWith((path) => {
    const properties = path.value.argument.properties.filter(
      (property) => property.type !== "SpreadElement" && property.name !== "decoded"
    );
    properties.push(j.spreadElement(j.identifier(newReturn)));
    return j.returnStatement(j.objectExpression(properties));
  });
  return ast.toSource({
    trailingComma: true,
    quote: "single",
    lineTerminator: "\n"
  });
}
