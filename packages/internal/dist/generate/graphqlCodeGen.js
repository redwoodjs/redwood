"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.generateTypeDefGraphQLWeb = exports.generateTypeDefGraphQLApi = void 0;
exports.getLoadDocumentsOptions = getLoadDocumentsOptions;
exports.getResolverFnType = void 0;
require("core-js/modules/es.array.push.js");
var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/concat"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/keys"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _values = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/values"));
var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/reduce"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var addPlugin = _interopRequireWildcard(require("@graphql-codegen/add"));
var _cli = require("@graphql-codegen/cli");
var _core = require("@graphql-codegen/core");
var typescriptPlugin = _interopRequireWildcard(require("@graphql-codegen/typescript"));
var typescriptOperations = _interopRequireWildcard(require("@graphql-codegen/typescript-operations"));
var _codeFileLoader = require("@graphql-tools/code-file-loader");
var _graphqlFileLoader = require("@graphql-tools/graphql-file-loader");
var _load = require("@graphql-tools/load");
var _execa = _interopRequireDefault(require("execa"));
var _graphql = require("graphql");
var _projectConfig = require("@redwoodjs/project-config");
var _project = require("../project");
var rwTypescriptResolvers = _interopRequireWildcard(require("./plugins/rw-typescript-resolvers"));
var CodegenSide = /*#__PURE__*/function (CodegenSide) {
  CodegenSide[CodegenSide["API"] = 0] = "API";
  CodegenSide[CodegenSide["WEB"] = 1] = "WEB";
  return CodegenSide;
}(CodegenSide || {});
const generateTypeDefGraphQLApi = async () => {
  var _context;
  const config = (0, _projectConfig.getConfig)();
  const errors = [];
  if (config.experimental.useSDLCodeGenForGraphQLTypes) {
    const paths = (0, _projectConfig.getPaths)();
    const sdlCodegen = await import('@sdl-codegen/node');
    const dtsFiles = [];
    try {
      const output = sdlCodegen.runFullCodegen('redwood', {
        paths
      });
      (0, _concat.default)(dtsFiles).call(dtsFiles, output.paths);
    } catch (e) {
      if (e instanceof Error) {
        errors.push({
          message: e.message,
          error: e
        });
      }
    }
    return {
      typeDefFiles: dtsFiles,
      errors
    };
  }
  const filename = _path.default.join((0, _projectConfig.getPaths)().api.types, 'graphql.d.ts');
  const prismaModels = await getPrismaModels();
  const prismaImports = (0, _map.default)(_context = (0, _keys.default)(prismaModels)).call(_context, key => {
    return `${key} as Prisma${key}`;
  });
  const extraPlugins = [{
    name: 'add',
    options: {
      content: ['import { Prisma } from "@prisma/client"', "import { MergePrismaWithSdlTypes, MakeRelationsOptional } from '@redwoodjs/api'", `import { ${prismaImports.join(', ')} } from '@prisma/client'`],
      placement: 'prepend'
    },
    codegenPlugin: addPlugin
  }, {
    name: 'print-mapped-models',
    options: {},
    codegenPlugin: printMappedModelsPlugin
  }, {
    name: 'typescript-resolvers',
    options: {},
    codegenPlugin: rwTypescriptResolvers
  }];
  try {
    return {
      typeDefFiles: await runCodegenGraphQL([], extraPlugins, filename, CodegenSide.API),
      errors
    };
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL type definitions (api)',
      error: e
    });
    return {
      typeDefFiles: [],
      errors
    };
  }
};
exports.generateTypeDefGraphQLApi = generateTypeDefGraphQLApi;
const generateTypeDefGraphQLWeb = async () => {
  const filename = _path.default.join((0, _projectConfig.getPaths)().web.types, 'graphql.d.ts');
  const options = getLoadDocumentsOptions(filename);
  const documentsGlob = './web/src/**/!(*.d).{ts,tsx,js,jsx}';
  let documents;
  try {
    documents = await (0, _load.loadDocuments)([documentsGlob], options);
  } catch {
    // No GraphQL documents present, no need to try to run codegen
    return {
      typeDefFiles: [],
      errors: []
    };
  }
  const extraPlugins = [{
    name: 'add',
    options: {
      content: 'import { Prisma } from "@prisma/client"',
      placement: 'prepend'
    },
    codegenPlugin: addPlugin
  }, {
    name: 'typescript-operations',
    options: {},
    codegenPlugin: typescriptOperations
  }];
  const errors = [];
  try {
    return {
      typeDefFiles: await runCodegenGraphQL(documents, extraPlugins, filename, CodegenSide.WEB),
      errors
    };
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL type definitions (web)',
      error: e
    });
    return {
      typeDefFiles: [],
      errors
    };
  }
};

/**
 * This is the function used internally by generateTypeDefGraphQLApi and generateTypeDefGraphQLWeb
 * And contains the base configuration for generating gql types with codegen
 *
 * Named a little differently to make it easier to spot
 */
exports.generateTypeDefGraphQLWeb = generateTypeDefGraphQLWeb;
async function runCodegenGraphQL(documents, extraPlugins, filename, side) {
  const userCodegenConfig = await (0, _cli.loadCodegenConfig)({
    configFilePath: (0, _projectConfig.getPaths)().base
  });

  // Merge in user codegen config with the rw built-in one
  const mergedConfig = {
    ...(await getPluginConfig(side)),
    ...userCodegenConfig?.config?.config
  };
  const options = getCodegenOptions(documents, mergedConfig, extraPlugins);
  const output = await (0, _core.codegen)(options);
  _fs.default.mkdirSync(_path.default.dirname(filename), {
    recursive: true
  });
  _fs.default.writeFileSync(filename, output);
  return [filename];
}
function getLoadDocumentsOptions(filename) {
  const loadTypedefsConfig = {
    cwd: (0, _projectConfig.getPaths)().base,
    ignore: [_path.default.join(process.cwd(), filename)],
    loaders: [new _codeFileLoader.CodeFileLoader()],
    sort: true
  };
  return loadTypedefsConfig;
}
async function getPrismaClient(hasGenerated = false) {
  const {
    default: localPrisma
  } = await import('@prisma/client');

  // @ts-expect-error I believe this type will only exist if the prisma client has been generated
  if (!localPrisma.ModelName) {
    if (hasGenerated) {
      return {
        ModelName: {}
      };
    } else {
      var _context2;
      _execa.default.sync('yarn rw prisma generate', {
        shell: true
      });

      // Purge Prisma Client from node's require cache, so that the newly
      // generated client gets picked up by any script that uses it
      (0, _forEach.default)(_context2 = (0, _keys.default)(require.cache)).call(_context2, key => {
        if ((0, _includes.default)(key).call(key, '/node_modules/@prisma/client/') || (0, _includes.default)(key).call(key, '/node_modules/.prisma/client/')) {
          delete require.cache[key];
        }
      });
      return getPrismaClient(true);
    }
  }

  // @ts-expect-error See above, the generated client should contain a ModelName property that
  // satisfies Record<string, string>
  return localPrisma;
}
async function getPrismaModels() {
  // Extract the models from the prisma client and use those to
  // set up internal redirects for the return values in resolvers.
  const localPrisma = await getPrismaClient();
  const prismaModels = localPrisma.ModelName;

  // This isn't really something you'd put in the GraphQL API, so
  // we can skip the model.
  if (prismaModels.RW_DataMigration) {
    delete prismaModels.RW_DataMigration;
  }
  return prismaModels;
}
async function getPluginConfig(side) {
  var _context3;
  const prismaModels = await getPrismaModels();
  (0, _forEach.default)(_context3 = (0, _keys.default)(prismaModels)).call(_context3, key => {
    /** creates an object like this
     * {
     *  Post: MergePrismaWithSdlTypes<PrismaPost, MakeRelationsOptional<Post, AllMappedModels>, AllMappedModels>>
     *  ...
     * }
     */
    prismaModels[key] = `MergePrismaWithSdlTypes<Prisma${key}, MakeRelationsOptional<${key}, AllMappedModels>, AllMappedModels>`;
  });
  const pluginConfig = {
    makeResolverTypeCallable: true,
    namingConvention: 'keep',
    // to allow camelCased query names
    scalars: {
      // We need these, otherwise these scalars are mapped to any
      BigInt: 'number',
      // @Note: DateTime fields can be valid Date-strings, or the Date object in the api side. They're always strings on the web side.
      DateTime: side === CodegenSide.WEB ? 'string' : 'Date | string',
      Date: side === CodegenSide.WEB ? 'string' : 'Date | string',
      JSON: 'Prisma.JsonValue',
      JSONObject: 'Prisma.JsonObject',
      Time: side === CodegenSide.WEB ? 'string' : 'Date | string',
      Byte: 'Buffer'
    },
    // prevent type names being PetQueryQuery, RW generators already append
    // Query/Mutation/etc
    omitOperationSuffix: true,
    showUnusedMappers: false,
    customResolverFn: getResolverFnType(),
    mappers: prismaModels,
    avoidOptionals: {
      // We do this, so that service tests can call resolvers without doing a null check
      // see https://github.com/redwoodjs/redwood/pull/6222#issuecomment-1230156868
      // Look at type or source https://shrtm.nu/2BA0 for possible config, not well documented
      resolvers: true
    },
    contextType: `@redwoodjs/graphql-server/dist/types#RedwoodGraphQLContext`
  };
  return pluginConfig;
}
const getResolverFnType = () => {
  const tsConfig = (0, _project.getTsConfigs)();
  if (tsConfig.api?.compilerOptions?.strict) {
    // In strict mode, bring a world of pain to the tests
    return `(
      args: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`;
  } else {
    return `(
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`;
  }
};
exports.getResolverFnType = getResolverFnType;
/**
 * Codgen plugin that just lists all the SDL models that are also mapped Prisma models
 * We use a plugin, because its possible to have Prisma models that do not have an SDL model
 * so we can't just list all the Prisma models, even if they're included in the mappers object.
 *
 * Example:
 * type AllMappedModels = MaybeOrArrayOfMaybe<Post | User>
 *
 * Note that the types are SDL types, not Prisma types.
 * We do not include SDL-only types in this list.
 */
const printMappedModelsPlugin = {
  plugin: (schema, _documents, config) => {
    var _context4, _context5, _context6;
    // this way we can make sure relation types are not required
    const sdlTypesWhichAreMapped = (0, _map.default)(_context4 = (0, _filter.default)(_context5 = (0, _filter.default)(_context6 = (0, _values.default)(schema.getTypeMap())).call(_context6, type => {
      return type.astNode?.kind === _graphql.Kind.OBJECT_TYPE_DEFINITION;
    })).call(_context5, objectDefType => {
      const modelName = objectDefType.astNode?.name.value;
      return modelName && modelName in config.mappers // Only keep the mapped Prisma models
      ;
    })).call(_context4, objectDefType => objectDefType.astNode?.name.value);
    return `type MaybeOrArrayOfMaybe<T> = T | Maybe<T> | Maybe<T>[];\ntype AllMappedModels = MaybeOrArrayOfMaybe<${sdlTypesWhichAreMapped.join(' | ')}>`;
  }
};
function getCodegenOptions(documents, config, extraPlugins) {
  const plugins = [{
    typescript: {
      enumsAsTypes: true
    }
  }, ...(0, _map.default)(extraPlugins).call(extraPlugins, plugin => ({
    [plugin.name]: plugin.options
  }))];
  const pluginMap = {
    typescript: typescriptPlugin,
    ...(0, _reduce.default)(extraPlugins).call(extraPlugins, (acc, cur) => ({
      ...acc,
      [cur.name]: cur.codegenPlugin
    }), {})
  };
  const options = {
    // The typescript plugin returns a string instead of writing to a file, so
    // `filename` is not used
    filename: '',
    // `schemaAst` is used instead of `schema` if `schemaAst` is defined, and
    // `schema` isn't. In the source for GenerateOptions they have this
    // comment:
    //   Remove schemaAst and change schema to GraphQLSchema in the next major
    //   version
    // When that happens we'll have have to remove our `schema` line, and
    // rename `schemaAst` to `schema`
    schema: undefined,
    schemaAst: (0, _load.loadSchemaSync)((0, _projectConfig.getPaths)().generated.schema, {
      loaders: [new _graphqlFileLoader.GraphQLFileLoader()],
      sort: true
    }),
    documents,
    config,
    plugins,
    pluginMap,
    pluginContext: {}
  };
  return options;
}