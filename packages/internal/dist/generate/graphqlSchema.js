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
var graphqlSchema_exports = {};
__export(graphqlSchema_exports, {
  generateGraphQLSchema: () => generateGraphQLSchema
});
module.exports = __toCommonJS(graphqlSchema_exports);
var import_fs = __toESM(require("fs"));
var import_core = require("@graphql-codegen/core");
var schemaAstPlugin = __toESM(require("@graphql-codegen/schema-ast"));
var import_code_file_loader = require("@graphql-tools/code-file-loader");
var import_load = require("@graphql-tools/load");
var import_internals = require("@prisma/internals");
var import_chalk = __toESM(require("chalk"));
var import_graphql = require("graphql");
var import_terminal_link = __toESM(require("terminal-link"));
var import_graphql_server = require("@redwoodjs/graphql-server");
var import_project_config = require("@redwoodjs/project-config");
const generateGraphQLSchema = async () => {
  const redwoodProjectPaths = (0, import_project_config.getPaths)();
  const schemaPointerMap = {
    [(0, import_graphql.print)(import_graphql_server.rootSchema.schema)]: {},
    "graphql/**/*.sdl.{js,ts}": {},
    "directives/**/*.{js,ts}": {},
    "subscriptions/**/*.{js,ts}": {}
  };
  if ((0, import_project_config.resolveFile)(`${(0, import_project_config.getPaths)().api.src}/server`)) {
    try {
      const { liveDirectiveTypeDefs } = await import("@redwoodjs/realtime");
      schemaPointerMap[liveDirectiveTypeDefs] = {};
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND") {
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
    schema: Object.keys(schemaPointerMap),
    generates: {
      [redwoodProjectPaths.generated.schema]: {
        plugins: ["schema-ast"]
      }
    },
    silent: false,
    errorsOnly: false,
    pluginContext: {},
    loaders: [new import_code_file_loader.CodeFileLoader()]
  };
  let loadedSchema;
  const errors = [];
  try {
    loadedSchema = await (0, import_load.loadSchema)(schemaPointerMap, loadSchemaConfig);
  } catch (e) {
    if (e instanceof Error) {
      const match = e.message.match(/Unknown type: "(\w+)"/);
      const name = match?.[1];
      const schemaPrisma = (await (0, import_internals.getSchema)(redwoodProjectPaths.api.dbSchema)).toString();
      const errorObject = {
        message: `Schema loading failed. ${e.message}`,
        error: e
      };
      errors.push(errorObject);
      if (name && schemaPrisma.includes(`model ${name}`)) {
        errorObject.message = [
          errorObject.message,
          "",
          `  ${import_chalk.default.bgYellow(` ${import_chalk.default.black.bold("Heads up")} `)}`,
          "",
          import_chalk.default.yellow(
            `  It looks like you have a ${name} model in your Prisma schema.`
          ),
          import_chalk.default.yellow(
            `  If it's part of a relation, you may have to generate SDL or scaffolding for ${name} too.`
          ),
          import_chalk.default.yellow(
            `  So, if you haven't done that yet, ignore this error message and run the SDL or scaffold generator for ${name} now.`
          ),
          "",
          import_chalk.default.yellow(
            `  See the ${(0, import_terminal_link.default)(
              "Troubleshooting Generators",
              "https://redwoodjs.com/docs/schema-relations#troubleshooting-generators"
            )} section in our docs for more help.`
          )
        ].join("\n");
      }
    }
  }
  const options = {
    config: {},
    // no extra config needed for merged schema file generation
    plugins: [{ "schema-ast": {} }],
    pluginMap: { "schema-ast": schemaAstPlugin },
    schema: {},
    schemaAst: loadedSchema,
    filename: redwoodProjectPaths.generated.schema,
    documents: []
  };
  if (loadedSchema) {
    try {
      const schema = await (0, import_core.codegen)(options);
      import_fs.default.writeFileSync(redwoodProjectPaths.generated.schema, schema);
      return { schemaPath: redwoodProjectPaths.generated.schema, errors };
    } catch (e) {
      errors.push({
        message: `GraphQL Schema codegen failed`,
        error: e
      });
    }
  }
  return { schemaPath: "", errors };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateGraphQLSchema
});
