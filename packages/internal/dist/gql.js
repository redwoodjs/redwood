"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.parseGqlQueryToAst = exports.parseDocumentAST = exports.listQueryTypeFieldsInProject = void 0;
require("core-js/modules/es.array.push.js");
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/keys"));
var _codeFileLoader = require("@graphql-tools/code-file-loader");
var _load = require("@graphql-tools/load");
var _graphql = require("graphql");
var _graphqlServer = require("@redwoodjs/graphql-server");
var _projectConfig = require("@redwoodjs/project-config");
const parseGqlQueryToAst = gqlQuery => {
  const ast = (0, _graphql.parse)(gqlQuery);
  return parseDocumentAST(ast);
};
exports.parseGqlQueryToAst = parseGqlQueryToAst;
const parseDocumentAST = document => {
  const operations = [];
  (0, _graphql.visit)(document, {
    OperationDefinition(node) {
      var _context;
      const fields = [];
      (0, _forEach.default)(_context = node.selectionSet.selections).call(_context, field => {
        fields.push(getFields(field));
      });
      operations.push({
        operation: node.operation,
        name: node.name?.value,
        fields
      });
    }
  });
  return operations;
};
exports.parseDocumentAST = parseDocumentAST;
const getFields = field => {
  // base
  if (!field.selectionSet) {
    return field.name.value;
  } else {
    const obj = {
      [field.name.value]: []
    };
    const lookAtFieldNode = node => {
      node.selectionSet?.selections.forEach(subField => {
        switch (subField.kind) {
          case _graphql.Kind.FIELD:
            obj[field.name.value].push(getFields(subField));
            break;
          case _graphql.Kind.FRAGMENT_SPREAD:
            // TODO: Maybe this will also be needed, right now it's accounted for to not crash in the tests
            break;
          case _graphql.Kind.INLINE_FRAGMENT:
            lookAtFieldNode(subField);
        }
      });
    };
    lookAtFieldNode(field);
    return obj;
  }
};
const listQueryTypeFieldsInProject = async () => {
  try {
    const schemaPointerMap = {
      [(0, _graphql.print)(_graphqlServer.rootSchema.schema)]: {},
      'graphql/**/*.sdl.{js,ts}': {},
      'directives/**/*.{js,ts}': {},
      'subscriptions/**/*.{js,ts}': {}
    };
    const mergedSchema = await (0, _load.loadSchema)(schemaPointerMap, {
      loaders: [new _codeFileLoader.CodeFileLoader({
        noRequire: true,
        pluckConfig: {
          globalGqlIdentifierName: 'gql'
        }
      })],
      cwd: (0, _projectConfig.getPaths)().api.src,
      assumeValidSDL: true
    });
    const queryTypeFields = mergedSchema.getQueryType()?.getFields();

    // Return empty array if no schema found
    return (0, _keys.default)(queryTypeFields ?? {});
  } catch (e) {
    console.error(e);
    return [];
  }
};
exports.listQueryTypeFieldsInProject = listQueryTypeFieldsInProject;