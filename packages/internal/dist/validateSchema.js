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
var validateSchema_exports = {};
__export(validateSchema_exports, {
  DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE: () => DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE,
  DIRECTIVE_REQUIRED_ERROR_MESSAGE: () => DIRECTIVE_REQUIRED_ERROR_MESSAGE,
  RESERVED_TYPES: () => RESERVED_TYPES,
  loadAndValidateSdls: () => loadAndValidateSdls,
  validateSchema: () => validateSchema
});
module.exports = __toCommonJS(validateSchema_exports);
var import_code_file_loader = require("@graphql-tools/code-file-loader");
var import_load = require("@graphql-tools/load");
var import_merge = require("@graphql-tools/merge");
var import_graphql = require("graphql");
var import_graphql_server = require("@redwoodjs/graphql-server");
var import_project_config = require("@redwoodjs/project-config");
var import_project = require("./project");
const DIRECTIVE_REQUIRED_ERROR_MESSAGE = "You must specify one of @requireAuth, @skipAuth or a custom directive";
const DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE = "Please check that the requireAuth roles is a string or an array of strings.";
const RESERVED_TYPES = [
  "Int",
  "Float",
  "Boolean",
  "String",
  "DateTime",
  "ID",
  "uid",
  "as"
];
function validateSchema(schemaDocumentNode, typesToCheck = ["Query", "Mutation"]) {
  const validationOutput = [];
  const reservedNameValidationOutput = [];
  const directiveRoleValidationOutput = [];
  if ((0, import_project.isServerFileSetup)() && (0, import_project.isRealtimeSetup)()) {
    typesToCheck.push("Subscription");
  }
  (0, import_graphql.visit)(schemaDocumentNode, {
    InterfaceTypeDefinition(typeNode) {
      if (RESERVED_TYPES.includes(typeNode.name.value)) {
        reservedNameValidationOutput.push({
          objectType: "interface",
          name: typeNode.name.value
        });
      }
    },
    InputObjectTypeDefinition(typeNode) {
      if (RESERVED_TYPES.includes(typeNode.name.value)) {
        reservedNameValidationOutput.push({
          objectType: "input type",
          name: typeNode.name.value
        });
      }
    },
    ObjectTypeDefinition(typeNode) {
      if (RESERVED_TYPES.includes(typeNode.name.value)) {
        reservedNameValidationOutput.push({
          objectType: "type",
          name: typeNode.name.value
        });
      }
      if (typesToCheck.includes(typeNode.name.value)) {
        for (const field of typeNode.fields || []) {
          const fieldName = field.name.value;
          const fieldTypeName = typeNode.name.value;
          const isRedwoodQuery = fieldName === "redwood" && fieldTypeName === "Query";
          const isCurrentUserQuery = fieldName === "currentUser" && fieldTypeName === "Query";
          if (!(isRedwoodQuery || isCurrentUserQuery)) {
            const hasDirective = field.directives?.length;
            if (!hasDirective) {
              validationOutput.push(`${fieldName} ${fieldTypeName}`);
            }
            field.directives?.forEach((directive) => {
              if (directive.name.value === "requireAuth") {
                directive.arguments?.forEach((arg) => {
                  if (arg.name.value === "roles") {
                    if (arg.value.kind !== import_graphql.Kind.STRING && arg.value.kind !== import_graphql.Kind.LIST) {
                      directiveRoleValidationOutput.push({
                        fieldName,
                        invalid: arg.value.kind
                      });
                    }
                    if (arg.value.kind === import_graphql.Kind.LIST) {
                      const invalidValues = arg.value.values?.filter(
                        (val) => val.kind !== import_graphql.Kind.STRING
                      );
                      if (invalidValues.length > 0) {
                        invalidValues.forEach((invalid) => {
                          directiveRoleValidationOutput.push({
                            fieldName,
                            invalid: invalid.kind
                          });
                        });
                      }
                    }
                  }
                });
              }
            });
          }
        }
      }
    }
  });
  if (validationOutput.length > 0) {
    const fieldsWithoutDirectives = validationOutput.map(
      (field) => `- ${field}`
    );
    throw new Error(
      `${DIRECTIVE_REQUIRED_ERROR_MESSAGE} for
${fieldsWithoutDirectives.join(
        "\n"
      )} 
`
    );
  }
  if (directiveRoleValidationOutput.length > 0) {
    const fieldWithInvalidRoleValues = directiveRoleValidationOutput.map(
      (field) => `- ${field.fieldName} has an invalid ${field.invalid}`
    );
    throw new RangeError(
      `${DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE}

${fieldWithInvalidRoleValues.join(
        "\n"
      )} 

For example: @requireAuth(roles: "admin") or @requireAuth(roles: ["admin", "editor"])`
    );
  }
  if (reservedNameValidationOutput.length > 0) {
    const reservedNameMsg = reservedNameValidationOutput.map(
      (output) => {
        return `The ${output.objectType} named '${output.name}' is a reserved GraphQL name.
Please rename it to something more specific, like: Application${output.name}.
`;
      }
    );
    throw new TypeError(reservedNameMsg.join("\n"));
  }
}
const loadAndValidateSdls = async () => {
  const projectTypeSrc = await (0, import_load.loadTypedefs)(
    [
      "graphql/**/*.sdl.{js,ts}",
      "directives/**/*.{js,ts}",
      "subscriptions/**/*.{js,ts}"
    ],
    {
      loaders: [
        new import_code_file_loader.CodeFileLoader({
          noRequire: true,
          pluckConfig: {
            globalGqlIdentifierName: "gql"
          }
        })
      ],
      cwd: (0, import_project_config.getPaths)().api.src
    }
  );
  const projectDocumentNodes = Object.values(projectTypeSrc).map(({ document }) => document).filter((documentNode) => {
    return !!documentNode;
  });
  const mergedDocumentNode = (0, import_merge.mergeTypeDefs)([
    import_graphql_server.rootSchema.schema,
    projectDocumentNodes
  ]);
  validateSchema(mergedDocumentNode);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE,
  DIRECTIVE_REQUIRED_ERROR_MESSAGE,
  RESERVED_TYPES,
  loadAndValidateSdls,
  validateSchema
});
