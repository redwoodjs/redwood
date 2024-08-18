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
var updateResolverTypes_exports = {};
__export(updateResolverTypes_exports, {
  default: () => transform
});
module.exports = __toCommonJS(updateResolverTypes_exports);
var import_jscodeshift = require("jscodeshift");
const isTypeReference = (typeAnnotation) => import_jscodeshift.TSTypeReference.check(typeAnnotation);
const getTypeName = (node) => {
  return import_jscodeshift.Identifier.check(node.typeName) ? node.typeName.name : null;
};
const isWrappedInPartial = (node) => {
  const typeAnnotation = node.typeAnnotation;
  return isTypeReference(typeAnnotation) && getTypeName(typeAnnotation) === "Partial";
};
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  const findImportFromGqlTypes = (importName) => {
    return ast.find(j.ImportDeclaration, {
      source: { value: "types/graphql" }
    }).find(j.ImportSpecifier, { imported: { name: importName } });
  };
  const addToGqlTypesImports = (importName) => {
    ast.find(j.ImportDeclaration, {
      source: { value: "types/graphql" }
    }).forEach((importStatement) => {
      importStatement.node.specifiers?.push(
        j.importSpecifier(j.identifier(importName))
      );
    });
  };
  ast.find(j.TSTypeAnnotation).forEach((path) => {
    const typeAnnotationNode = path.node;
    if (
      // If it's a MutationResolvers['x'] or QueryResolvers['x']
      j.TSIndexedAccessType.check(typeAnnotationNode.typeAnnotation)
    ) {
      return;
    }
    if (!isWrappedInPartial(typeAnnotationNode) && isTypeReference(typeAnnotationNode.typeAnnotation)) {
      const originalTypeName = getTypeName(typeAnnotationNode.typeAnnotation);
      if (!originalTypeName || !originalTypeName.includes("Resolvers") || findImportFromGqlTypes(originalTypeName).length === 0 || // check if it was imported from types/graphql
      originalTypeName.includes("RelationResolvers")) {
        return;
      }
      const newTypeName = originalTypeName.replace(
        "Resolvers",
        "RelationResolvers"
      );
      console.log(`Converting ${originalTypeName} to ${newTypeName}....`);
      path.replace(
        j.tsTypeAnnotation(j.tsTypeReference(j.identifier(newTypeName)))
      );
      findImportFromGqlTypes(originalTypeName)?.remove();
      addToGqlTypesImports(newTypeName);
    }
  });
  return ast.toSource();
}
