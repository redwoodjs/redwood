"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.generateGraphQLSchema = void 0;
require("core-js/modules/es.array.push.js");
var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/keys"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _fs = _interopRequireDefault(require("fs"));
var _core = require("@graphql-codegen/core");
var schemaAstPlugin = _interopRequireWildcard(require("@graphql-codegen/schema-ast"));
var _codeFileLoader = require("@graphql-tools/code-file-loader");
var _load = require("@graphql-tools/load");
var _internals = require("@prisma/internals");
var _chalk = _interopRequireDefault(require("chalk"));
var _graphql = require("graphql");
var _terminalLink = _interopRequireDefault(require("terminal-link"));
var _graphqlServer = require("@redwoodjs/graphql-server");
var _projectConfig = require("@redwoodjs/project-config");
const generateGraphQLSchema = async () => {
  const redwoodProjectPaths = (0, _projectConfig.getPaths)();
  const schemaPointerMap = {
    [(0, _graphql.print)(_graphqlServer.rootSchema.schema)]: {},
    'graphql/**/*.sdl.{js,ts}': {},
    'directives/**/*.{js,ts}': {},
    'subscriptions/**/*.{js,ts}': {}
  };

  // If we're serverful and the user is using realtime, we need to include the live directive for realtime support.
  // Note the `ERR_  prefix in`ERR_MODULE_NOT_FOUND`. Since we're using `await import`,
  // if the package (here, `@redwoodjs/realtime`) can't be found, it throws this error, with the prefix.
  // Whereas `require('@redwoodjs/realtime')` would throw `MODULE_NOT_FOUND`.
  if ((0, _projectConfig.resolveFile)(`${(0, _projectConfig.getPaths)().api.src}/server`)) {
    try {
      const {
        liveDirectiveTypeDefs
      } = await import('@redwoodjs/realtime');
      schemaPointerMap[liveDirectiveTypeDefs] = {};
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND') {
        throw error;
      }
    }
  }
  const loadSchemaConfig = {
    assumeValidSDL: true,
    sort: true,
    convertExtensions: true,
    includeSources: true,
    cwd: redwoodProjectPaths.api.src,
    schema: (0, _keys.default)(schemaPointerMap),
    generates: {
      [redwoodProjectPaths.generated.schema]: {
        plugins: ['schema-ast']
      }
    },
    silent: false,
    errorsOnly: false,
    pluginContext: {},
    loaders: [new _codeFileLoader.CodeFileLoader()]
  };
  let loadedSchema;
  const errors = [];
  try {
    loadedSchema = await (0, _load.loadSchema)(schemaPointerMap, loadSchemaConfig);
  } catch (e) {
    if (e instanceof Error) {
      const match = e.message.match(/Unknown type: "(\w+)"/);
      const name = match?.[1];
      const schemaPrisma = (await (0, _internals.getSchema)(redwoodProjectPaths.api.dbSchema)).toString();
      const errorObject = {
        message: `Schema loading failed. ${e.message}`,
        error: e
      };
      errors.push(errorObject);
      if (name && (0, _includes.default)(schemaPrisma).call(schemaPrisma, `model ${name}`)) {
        // Not all SDLs need to be backed by a DB model, but if they are we can
        // provide a more helpful error message

        errorObject.message = [errorObject.message, '', `  ${_chalk.default.bgYellow(` ${_chalk.default.black.bold('Heads up')} `)}`, '', _chalk.default.yellow(`  It looks like you have a ${name} model in your Prisma schema.`), _chalk.default.yellow(`  If it's part of a relation, you may have to generate SDL or scaffolding for ${name} too.`), _chalk.default.yellow(`  So, if you haven't done that yet, ignore this error message and run the SDL or scaffold generator for ${name} now.`), '', _chalk.default.yellow(`  See the ${(0, _terminalLink.default)('Troubleshooting Generators', 'https://redwoodjs.com/docs/schema-relations#troubleshooting-generators')} section in our docs for more help.`)].join('\n');
      }
    }
  }
  const options = {
    config: {},
    // no extra config needed for merged schema file generation
    plugins: [{
      'schema-ast': {}
    }],
    pluginMap: {
      'schema-ast': schemaAstPlugin
    },
    schema: {},
    schemaAst: loadedSchema,
    filename: redwoodProjectPaths.generated.schema,
    documents: []
  };
  if (loadedSchema) {
    try {
      const schema = await (0, _core.codegen)(options);
      _fs.default.writeFileSync(redwoodProjectPaths.generated.schema, schema);
      return {
        schemaPath: redwoodProjectPaths.generated.schema,
        errors
      };
    } catch (e) {
      errors.push({
        message: `GraphQL Schema codegen failed`,
        error: e
      });
    }
  }
  return {
    schemaPath: '',
    errors
  };
};
exports.generateGraphQLSchema = generateGraphQLSchema;