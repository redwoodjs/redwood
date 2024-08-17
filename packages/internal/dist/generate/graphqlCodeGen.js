"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var graphqlCodeGen_exports = {};
__export(graphqlCodeGen_exports, {
  generateTypeDefGraphQLApi: () => generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb: () => generateTypeDefGraphQLWeb,
  getLoadDocumentsOptions: () => getLoadDocumentsOptions,
  getResolverFnType: () => getResolverFnType
});
module.exports = __toCommonJS(graphqlCodeGen_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var addPlugin = __toESM(require("@graphql-codegen/add"));
var import_cli = require("@graphql-codegen/cli");
var import_core = require("@graphql-codegen/core");
var typescriptPlugin = __toESM(require("@graphql-codegen/typescript"));
var typescriptOperations = __toESM(require("@graphql-codegen/typescript-operations"));
var import_code_file_loader = require("@graphql-tools/code-file-loader");
var import_graphql_file_loader = require("@graphql-tools/graphql-file-loader");
var import_load = require("@graphql-tools/load");
var import_execa = __toESM(require("execa"));
var import_graphql = require("graphql");
var import_project_config = require("@redwoodjs/project-config");
var import_project = require("../project");
var rwTypescriptResolvers = __toESM(require("./plugins/rw-typescript-resolvers"));
var CodegenSide = /* @__PURE__ */ ((CodegenSide2) => {
  CodegenSide2[CodegenSide2["API"] = 0] = "API";
  CodegenSide2[CodegenSide2["WEB"] = 1] = "WEB";
  return CodegenSide2;
})(CodegenSide || {});
const generateTypeDefGraphQLApi = async () => {
  const config = (0, import_project_config.getConfig)();
  const errors = [];
  if (config.experimental.useSDLCodeGenForGraphQLTypes) {
    const paths = (0, import_project_config.getPaths)();
    const sdlCodegen = await import("@sdl-codegen/node");
    const dtsFiles = [];
    try {
      const output = sdlCodegen.runFullCodegen("redwood", { paths });
      dtsFiles.concat(output.paths);
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
  const filename = import_path.default.join((0, import_project_config.getPaths)().api.types, "graphql.d.ts");
  const prismaModels = await getPrismaModels();
  const prismaImports = Object.keys(prismaModels).map((key) => {
    return `${key} as Prisma${key}`;
  });
  const extraPlugins = [
    {
      name: "add",
      options: {
        content: [
          'import { Prisma } from "@prisma/client"',
          "import { MergePrismaWithSdlTypes, MakeRelationsOptional } from '@redwoodjs/api'",
          `import { ${prismaImports.join(", ")} } from '@prisma/client'`
        ],
        placement: "prepend"
      },
      codegenPlugin: addPlugin
    },
    {
      name: "print-mapped-models",
      options: {},
      codegenPlugin: printMappedModelsPlugin
    },
    {
      name: "typescript-resolvers",
      options: {},
      codegenPlugin: rwTypescriptResolvers
    }
  ];
  try {
    return {
      typeDefFiles: await runCodegenGraphQL(
        [],
        extraPlugins,
        filename,
        0 /* API */
      ),
      errors
    };
  } catch (e) {
    errors.push({
      message: "Error: Could not generate GraphQL type definitions (api)",
      error: e
    });
    return {
      typeDefFiles: [],
      errors
    };
  }
};
const generateTypeDefGraphQLWeb = async () => {
  const filename = import_path.default.join((0, import_project_config.getPaths)().web.types, "graphql.d.ts");
  const options = getLoadDocumentsOptions(filename);
  const documentsGlob = "./web/src/**/!(*.d).{ts,tsx,js,jsx}";
  let documents;
  try {
    documents = await (0, import_load.loadDocuments)([documentsGlob], options);
  } catch {
    return {
      typeDefFiles: [],
      errors: []
    };
  }
  const extraPlugins = [
    {
      name: "add",
      options: {
        content: 'import { Prisma } from "@prisma/client"',
        placement: "prepend"
      },
      codegenPlugin: addPlugin
    },
    {
      name: "typescript-operations",
      options: {},
      codegenPlugin: typescriptOperations
    }
  ];
  const errors = [];
  try {
    return {
      typeDefFiles: await runCodegenGraphQL(
        documents,
        extraPlugins,
        filename,
        1 /* WEB */
      ),
      errors
    };
  } catch (e) {
    errors.push({
      message: "Error: Could not generate GraphQL type definitions (web)",
      error: e
    });
    return {
      typeDefFiles: [],
      errors
    };
  }
};
async function runCodegenGraphQL(documents, extraPlugins, filename, side) {
  const userCodegenConfig = await (0, import_cli.loadCodegenConfig)({
    configFilePath: (0, import_project_config.getPaths)().base
  });
  const mergedConfig = {
    ...await getPluginConfig(side),
    ...userCodegenConfig?.config?.config
  };
  const options = getCodegenOptions(documents, mergedConfig, extraPlugins);
  const output = await (0, import_core.codegen)(options);
  import_fs.default.mkdirSync(import_path.default.dirname(filename), { recursive: true });
  import_fs.default.writeFileSync(filename, output);
  return [filename];
}
function getLoadDocumentsOptions(filename) {
  const loadTypedefsConfig = {
    cwd: (0, import_project_config.getPaths)().base,
    ignore: [import_path.default.join(process.cwd(), filename)],
    loaders: [new import_code_file_loader.CodeFileLoader()],
    sort: true
  };
  return loadTypedefsConfig;
}
async function getPrismaClient(hasGenerated = false) {
  const { default: localPrisma } = await import("@prisma/client");
  if (!localPrisma.ModelName) {
    if (hasGenerated) {
      return { ModelName: {} };
    } else {
      import_execa.default.sync("yarn rw prisma generate", { shell: true });
      Object.keys(require.cache).forEach((key) => {
        if (key.includes("/node_modules/@prisma/client/") || key.includes("/node_modules/.prisma/client/")) {
          delete require.cache[key];
        }
      });
      return getPrismaClient(true);
    }
  }
  return localPrisma;
}
async function getPrismaModels() {
  const localPrisma = await getPrismaClient();
  const prismaModels = localPrisma.ModelName;
  if (prismaModels.RW_DataMigration) {
    delete prismaModels.RW_DataMigration;
  }
  return prismaModels;
}
async function getPluginConfig(side) {
  const prismaModels = await getPrismaModels();
  Object.keys(prismaModels).forEach((key) => {
    prismaModels[key] = `MergePrismaWithSdlTypes<Prisma${key}, MakeRelationsOptional<${key}, AllMappedModels>, AllMappedModels>`;
  });
  const pluginConfig = {
    makeResolverTypeCallable: true,
    namingConvention: "keep",
    // to allow camelCased query names
    scalars: {
      // We need these, otherwise these scalars are mapped to any
      BigInt: "number",
      // @Note: DateTime fields can be valid Date-strings, or the Date object in the api side. They're always strings on the web side.
      DateTime: side === 1 /* WEB */ ? "string" : "Date | string",
      Date: side === 1 /* WEB */ ? "string" : "Date | string",
      JSON: "Prisma.JsonValue",
      JSONObject: "Prisma.JsonObject",
      Time: side === 1 /* WEB */ ? "string" : "Date | string",
      Byte: "Buffer"
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
  const tsConfig = (0, import_project.getTsConfigs)();
  if (tsConfig.api?.compilerOptions?.strict) {
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
const printMappedModelsPlugin = {
  plugin: (schema, _documents, config) => {
    const sdlTypesWhichAreMapped = Object.values(schema.getTypeMap()).filter((type) => {
      return type.astNode?.kind === import_graphql.Kind.OBJECT_TYPE_DEFINITION;
    }).filter((objectDefType) => {
      const modelName = objectDefType.astNode?.name.value;
      return modelName && modelName in config.mappers;
    }).map((objectDefType) => objectDefType.astNode?.name.value);
    return `type MaybeOrArrayOfMaybe<T> = T | Maybe<T> | Maybe<T>[];
type AllMappedModels = MaybeOrArrayOfMaybe<${sdlTypesWhichAreMapped.join(
      " | "
    )}>`;
  }
};
function getCodegenOptions(documents, config, extraPlugins) {
  const plugins = [
    { typescript: { enumsAsTypes: true } },
    ...extraPlugins.map((plugin) => ({ [plugin.name]: plugin.options }))
  ];
  const pluginMap = {
    typescript: typescriptPlugin,
    ...extraPlugins.reduce(
      (acc, cur) => ({ ...acc, [cur.name]: cur.codegenPlugin }),
      {}
    )
  };
  const options = {
    // The typescript plugin returns a string instead of writing to a file, so
    // `filename` is not used
    filename: "",
    // `schemaAst` is used instead of `schema` if `schemaAst` is defined, and
    // `schema` isn't. In the source for GenerateOptions they have this
    // comment:
    //   Remove schemaAst and change schema to GraphQLSchema in the next major
    //   version
    // When that happens we'll have have to remove our `schema` line, and
    // rename `schemaAst` to `schema`
    schema: void 0,
    schemaAst: (0, import_load.loadSchemaSync)((0, import_project_config.getPaths)().generated.schema, {
      loaders: [new import_graphql_file_loader.GraphQLFileLoader()],
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb,
  getLoadDocumentsOptions,
  getResolverFnType
});
