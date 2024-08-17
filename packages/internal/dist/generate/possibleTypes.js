"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.generatePossibleTypes = void 0;
require("core-js/modules/es.array.push.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var fragmentMatcher = _interopRequireWildcard(require("@graphql-codegen/fragment-matcher"));
var _graphqlFileLoader = require("@graphql-tools/graphql-file-loader");
var _load = require("@graphql-tools/load");
var _prettier = require("prettier");
var _projectConfig = require("@redwoodjs/project-config");
var _graphqlCodeGen = require("./graphqlCodeGen");
/**
 * Generate possible types from fragments and union types
 *
 * In order to use fragments with unions and interfaces in Apollo Client,
 * you need to tell the client how to discriminate between the different
 * types that implement or belong to a supertype.
 *
 * You pass a possibleTypes option to the InMemoryCache constructor
 * to specify these relationships in your schema.
 *
 * This object maps the name of an interface or union type (the supertype)
 * to the types that implement or belong to it (the subtypes).
 *
 * For example:
 *
 * ```ts
 * possibleTypes: {
 *  Character: ["Jedi", "Droid"],
 *  Test: ["PassingTest", "FailingTest", "SkippedTest"],
 *  Snake: ["Viper", "Python"],
 *  Groceries: ['Fruit', 'Vegetable'],
 * },
 * ```
 *
 * @see https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces
 **/
const generatePossibleTypes = async () => {
  const config = (0, _projectConfig.getConfig)();
  if (!config.graphql.fragments) {
    return {
      possibleTypesFiles: [],
      errors: []
    };
  }
  const filename = _path.default.join((0, _projectConfig.getPaths)().web.graphql, 'possibleTypes.ts');
  const options = (0, _graphqlCodeGen.getLoadDocumentsOptions)(filename);
  const documentsGlob = './web/src/**/!(*.d).{ts,tsx,js,jsx}';
  let documents;
  try {
    documents = await (0, _load.loadDocuments)([documentsGlob], options);
  } catch {
    // No GraphQL documents present, no need to try to generate possibleTypes
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
    const schema = (0, _load.loadSchemaSync)((0, _projectConfig.getPaths)().generated.schema, {
      loaders: [new _graphqlFileLoader.GraphQLFileLoader()],
      sort: true
    });
    const possibleTypes = await fragmentMatcher.plugin(schema, documents, pluginConfig, info);
    files.push(filename);
    const output = await (0, _prettier.format)(possibleTypes.toString(), {
      trailingComma: 'es5',
      bracketSpacing: true,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      arrowParens: 'always',
      parser: 'typescript'
    });
    _fs.default.mkdirSync(_path.default.dirname(filename), {
      recursive: true
    });
    _fs.default.writeFileSync(filename, output);
    return {
      possibleTypesFiles: [filename],
      errors
    };
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL possible types (web)',
      error: e
    });
    return {
      possibleTypesFiles: [],
      errors
    };
  }
};
exports.generatePossibleTypes = generatePossibleTypes;