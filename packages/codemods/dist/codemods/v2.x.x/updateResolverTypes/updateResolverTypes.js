"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _jscodeshift = require("jscodeshift");
const isTypeReference = typeAnnotation => _jscodeshift.TSTypeReference.check(typeAnnotation);
const getTypeName = node => {
  return _jscodeshift.Identifier.check(node.typeName) ? node.typeName.name : null;
};
const isWrappedInPartial = node => {
  const typeAnnotation = node.typeAnnotation;
  return isTypeReference(typeAnnotation) && getTypeName(typeAnnotation) === 'Partial';
};
function transform(file, api) {
  var _context3;
  const j = api.jscodeshift;
  const ast = j(file.source);
  const findImportFromGqlTypes = importName => {
    var _context;
    return (0, _find.default)(_context = (0, _find.default)(ast).call(ast, j.ImportDeclaration, {
      source: {
        value: 'types/graphql'
      }
    })).call(_context, j.ImportSpecifier, {
      imported: {
        name: importName
      }
    });
  };
  const addToGqlTypesImports = importName => {
    var _context2;
    (0, _forEach.default)(_context2 = (0, _find.default)(ast).call(ast, j.ImportDeclaration, {
      source: {
        value: 'types/graphql'
      }
    })).call(_context2, importStatement => {
      importStatement.node.specifiers?.push(j.importSpecifier(j.identifier(importName)));
    });
  };
  (0, _forEach.default)(_context3 = (0, _find.default)(ast).call(ast, j.TSTypeAnnotation)).call(_context3, path => {
    const typeAnnotationNode = path.node;
    if (
    // If it's a MutationResolvers['x'] or QueryResolvers['x']
    j.TSIndexedAccessType.check(typeAnnotationNode.typeAnnotation)) {
      return;
    }
    if (!isWrappedInPartial(typeAnnotationNode) && isTypeReference(typeAnnotationNode.typeAnnotation)) {
      const originalTypeName = getTypeName(typeAnnotationNode.typeAnnotation);
      if (!originalTypeName || !(0, _includes.default)(originalTypeName).call(originalTypeName, 'Resolvers') || findImportFromGqlTypes(originalTypeName).length === 0 ||
      // check if it was imported from types/graphql
      (0, _includes.default)(originalTypeName).call(originalTypeName, 'RelationResolvers') // check if it's already a RelationResolver
      ) {
        // Skip other type annotations!
        return;
      }
      const newTypeName = originalTypeName.replace('Resolvers', 'RelationResolvers');
      console.log(`Converting ${originalTypeName} to ${newTypeName}....`);
      path.replace(j.tsTypeAnnotation(j.tsTypeReference(j.identifier(newTypeName))));
      findImportFromGqlTypes(originalTypeName)?.remove();
      addToGqlTypesImports(newTypeName);
    }
  });
  return ast.toSource();
}