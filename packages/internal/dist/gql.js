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
var gql_exports = {};
__export(gql_exports, {
  listQueryTypeFieldsInProject: () => listQueryTypeFieldsInProject,
  parseDocumentAST: () => parseDocumentAST,
  parseGqlQueryToAst: () => parseGqlQueryToAst
});
module.exports = __toCommonJS(gql_exports);
var import_code_file_loader = require("@graphql-tools/code-file-loader");
var import_load = require("@graphql-tools/load");
var import_graphql = require("graphql");
var import_graphql_server = require("@redwoodjs/graphql-server");
var import_project_config = require("@redwoodjs/project-config");
const parseGqlQueryToAst = (gqlQuery) => {
  const ast = (0, import_graphql.parse)(gqlQuery);
  return parseDocumentAST(ast);
};
const parseDocumentAST = (document) => {
  const operations = [];
  (0, import_graphql.visit)(document, {
    OperationDefinition(node) {
      const fields = [];
      node.selectionSet.selections.forEach((field) => {
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
const getFields = (field) => {
  if (!field.selectionSet) {
    return field.name.value;
  } else {
    const obj = {
      [field.name.value]: []
    };
    const lookAtFieldNode = (node) => {
      node.selectionSet?.selections.forEach((subField) => {
        switch (subField.kind) {
          case import_graphql.Kind.FIELD:
            obj[field.name.value].push(getFields(subField));
            break;
          case import_graphql.Kind.FRAGMENT_SPREAD:
            break;
          case import_graphql.Kind.INLINE_FRAGMENT:
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
      [(0, import_graphql.print)(import_graphql_server.rootSchema.schema)]: {},
      "graphql/**/*.sdl.{js,ts}": {},
      "directives/**/*.{js,ts}": {},
      "subscriptions/**/*.{js,ts}": {}
    };
    const mergedSchema = await (0, import_load.loadSchema)(schemaPointerMap, {
      loaders: [
        new import_code_file_loader.CodeFileLoader({
          noRequire: true,
          pluckConfig: {
            globalGqlIdentifierName: "gql"
          }
        })
      ],
      cwd: (0, import_project_config.getPaths)().api.src,
      assumeValidSDL: true
    });
    const queryTypeFields = mergedSchema.getQueryType()?.getFields();
    return Object.keys(queryTypeFields ?? {});
  } catch (e) {
    console.error(e);
    return [];
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  listQueryTypeFieldsInProject,
  parseDocumentAST,
  parseGqlQueryToAst
});
