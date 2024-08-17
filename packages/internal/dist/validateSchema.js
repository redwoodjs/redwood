"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.loadAndValidateSdls = exports.RESERVED_TYPES = exports.DIRECTIVE_REQUIRED_ERROR_MESSAGE = exports.DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE = void 0;
exports.validateSchema = validateSchema;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _values = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/values"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _values2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/values"));
require("core-js/modules/es.array.push.js");
var _codeFileLoader = require("@graphql-tools/code-file-loader");
var _load = require("@graphql-tools/load");
var _merge = require("@graphql-tools/merge");
var _graphql = require("graphql");
var _graphqlServer = require("@redwoodjs/graphql-server");
var _projectConfig = require("@redwoodjs/project-config");
var _project = require("./project");
const DIRECTIVE_REQUIRED_ERROR_MESSAGE = exports.DIRECTIVE_REQUIRED_ERROR_MESSAGE = 'You must specify one of @requireAuth, @skipAuth or a custom directive';
const DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE = exports.DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE = 'Please check that the requireAuth roles is a string or an array of strings.';

/**
 * These are names that are commonly used in GraphQL schemas as scalars
 * and would cause a conflict if used as a type name.
 *
 * Note: Query, Mutation, and Subscription are not included here because
 * they are checked for separately.
 */
const RESERVED_TYPES = exports.RESERVED_TYPES = ['Int', 'Float', 'Boolean', 'String', 'DateTime', 'ID', 'uid', 'as'];
function validateSchema(schemaDocumentNode, typesToCheck = ['Query', 'Mutation']) {
  const validationOutput = [];
  const reservedNameValidationOutput = [];
  const directiveRoleValidationOutput = [];

  // Is Subscriptions are enabled with Redwood Realtime, then enforce a rule
  // that a Subscription type needs to have a authentication directive applied,
  // just as Query and Mutation requires
  if ((0, _project.isServerFileSetup)() && (0, _project.isRealtimeSetup)()) {
    typesToCheck.push('Subscription');
  }
  (0, _graphql.visit)(schemaDocumentNode, {
    InterfaceTypeDefinition(typeNode) {
      // Warn that an interface definition in the SDL is using a reserved GraphQL type
      if ((0, _includes.default)(RESERVED_TYPES).call(RESERVED_TYPES, typeNode.name.value)) {
        reservedNameValidationOutput.push({
          objectType: 'interface',
          name: typeNode.name.value
        });
      }
    },
    InputObjectTypeDefinition(typeNode) {
      // Warn that an input definition in the SDL is using a reserved GraphQL type
      if ((0, _includes.default)(RESERVED_TYPES).call(RESERVED_TYPES, typeNode.name.value)) {
        reservedNameValidationOutput.push({
          objectType: 'input type',
          name: typeNode.name.value
        });
      }
    },
    ObjectTypeDefinition(typeNode) {
      // Warn that a type definition in the SDL is using a reserved GraphQL type
      if ((0, _includes.default)(RESERVED_TYPES).call(RESERVED_TYPES, typeNode.name.value)) {
        reservedNameValidationOutput.push({
          objectType: 'type',
          name: typeNode.name.value
        });
      }
      if ((0, _includes.default)(typesToCheck).call(typesToCheck, typeNode.name.value)) {
        for (const field of typeNode.fields || []) {
          const fieldName = field.name.value;
          const fieldTypeName = typeNode.name.value;
          const isRedwoodQuery = fieldName === 'redwood' && fieldTypeName === 'Query';
          const isCurrentUserQuery = fieldName === 'currentUser' && fieldTypeName === 'Query';
          // skip validation for redwood query and currentUser
          if (!(isRedwoodQuery || isCurrentUserQuery)) {
            const hasDirective = field.directives?.length;
            if (!hasDirective) {
              validationOutput.push(`${fieldName} ${fieldTypeName}`);
            }

            // we want to check that the requireAuth directive roles argument value
            // is a string or an array of strings
            field.directives?.forEach(directive => {
              if (directive.name.value === 'requireAuth') {
                directive.arguments?.forEach(arg => {
                  if (arg.name.value === 'roles') {
                    if (arg.value.kind !== _graphql.Kind.STRING && arg.value.kind !== _graphql.Kind.LIST) {
                      directiveRoleValidationOutput.push({
                        fieldName: fieldName,
                        invalid: arg.value.kind
                      });
                    }

                    // check list (array)
                    if (arg.value.kind === _graphql.Kind.LIST) {
                      const invalidValues = (0, _values.default)(arg.value)?.filter(val => val.kind !== _graphql.Kind.STRING);
                      if (invalidValues.length > 0) {
                        (0, _forEach.default)(invalidValues).call(invalidValues, invalid => {
                          directiveRoleValidationOutput.push({
                            fieldName: fieldName,
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
    const fieldsWithoutDirectives = (0, _map.default)(validationOutput).call(validationOutput, field => `- ${field}`);
    throw new Error(`${DIRECTIVE_REQUIRED_ERROR_MESSAGE} for\n${fieldsWithoutDirectives.join('\n')} \n`);
  }
  if (directiveRoleValidationOutput.length > 0) {
    const fieldWithInvalidRoleValues = (0, _map.default)(directiveRoleValidationOutput).call(directiveRoleValidationOutput, field => `- ${field.fieldName} has an invalid ${field.invalid}`);
    throw new RangeError(`${DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE}\n\n${fieldWithInvalidRoleValues.join('\n')} \n\nFor example: @requireAuth(roles: "admin") or @requireAuth(roles: ["admin", "editor"])`);
  }
  if (reservedNameValidationOutput.length > 0) {
    const reservedNameMsg = (0, _map.default)(reservedNameValidationOutput).call(reservedNameValidationOutput, output => {
      return `The ${output.objectType} named '${output.name}' is a reserved GraphQL name.\nPlease rename it to something more specific, like: Application${output.name}.\n`;
    });
    throw new TypeError(reservedNameMsg.join('\n'));
  }
}
const loadAndValidateSdls = async () => {
  var _context, _context2;
  const projectTypeSrc = await (0, _load.loadTypedefs)(['graphql/**/*.sdl.{js,ts}', 'directives/**/*.{js,ts}', 'subscriptions/**/*.{js,ts}'], {
    loaders: [new _codeFileLoader.CodeFileLoader({
      noRequire: true,
      pluckConfig: {
        globalGqlIdentifierName: 'gql'
      }
    })],
    cwd: (0, _projectConfig.getPaths)().api.src
  });

  // The output of the above function doesn't give us the documents directly
  const projectDocumentNodes = (0, _filter.default)(_context = (0, _map.default)(_context2 = (0, _values2.default)(projectTypeSrc)).call(_context2, ({
    document
  }) => document)).call(_context, documentNode => {
    return !!documentNode;
  });

  // Merge in the rootSchema with JSON scalars, etc.
  const mergedDocumentNode = (0, _merge.mergeTypeDefs)([_graphqlServer.rootSchema.schema, projectDocumentNodes]);
  validateSchema(mergedDocumentNode);
};
exports.loadAndValidateSdls = loadAndValidateSdls;