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
var possibleTypes_exports = {};
__export(possibleTypes_exports, {
  generatePossibleTypes: () => generatePossibleTypes
});
module.exports = __toCommonJS(possibleTypes_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var fragmentMatcher = __toESM(require("@graphql-codegen/fragment-matcher"));
var import_graphql_file_loader = require("@graphql-tools/graphql-file-loader");
var import_load = require("@graphql-tools/load");
var import_prettier = require("prettier");
var import_project_config = require("@redwoodjs/project-config");
var import_graphqlCodeGen = require("./graphqlCodeGen");
const generatePossibleTypes = async () => {
  const config = (0, import_project_config.getConfig)();
  if (!config.graphql.fragments) {
    return {
      possibleTypesFiles: [],
      errors: []
    };
  }
  const filename = import_path.default.join((0, import_project_config.getPaths)().web.graphql, "possibleTypes.ts");
  const options = (0, import_graphqlCodeGen.getLoadDocumentsOptions)(filename);
  const documentsGlob = "./web/src/**/!(*.d).{ts,tsx,js,jsx}";
  let documents;
  try {
    documents = await (0, import_load.loadDocuments)([documentsGlob], options);
  } catch {
    return {
      possibleTypesFiles: [],
      errors: []
    };
  }
  const errors = [];
  try {
    const files = [];
    const pluginConfig = {};
    const info = {
      outputFile: filename
    };
    const schema = (0, import_load.loadSchemaSync)((0, import_project_config.getPaths)().generated.schema, {
      loaders: [new import_graphql_file_loader.GraphQLFileLoader()],
      sort: true
    });
    const possibleTypes = await fragmentMatcher.plugin(
      schema,
      documents,
      pluginConfig,
      info
    );
    files.push(filename);
    const output = await (0, import_prettier.format)(possibleTypes.toString(), {
      trailingComma: "es5",
      bracketSpacing: true,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      arrowParens: "always",
      parser: "typescript"
    });
    import_fs.default.mkdirSync(import_path.default.dirname(filename), { recursive: true });
    import_fs.default.writeFileSync(filename, output);
    return { possibleTypesFiles: [filename], errors };
  } catch (e) {
    errors.push({
      message: "Error: Could not generate GraphQL possible types (web)",
      error: e
    });
    return {
      possibleTypesFiles: [],
      errors
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generatePossibleTypes
});
