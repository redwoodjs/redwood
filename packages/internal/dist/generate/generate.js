#!/usr/bin/env node
"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.run = exports.generate = void 0;
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
require("core-js/modules/es.array.push.js");
var _projectConfig = require("@redwoodjs/project-config");
var _clientPreset = require("./clientPreset");
var _graphqlSchema = require("./graphqlSchema");
var _possibleTypes = require("./possibleTypes");
var _typeDefinitions = require("./typeDefinitions");
const generate = async () => {
  var _context;
  const config = (0, _projectConfig.getConfig)();
  const {
    schemaPath,
    errors: generateGraphQLSchemaErrors
  } = await (0, _graphqlSchema.generateGraphQLSchema)();
  const {
    typeDefFiles,
    errors: generateTypeDefsErrors
  } = await (0, _typeDefinitions.generateTypeDefs)();
  const clientPresetFiles = [];
  const {
    possibleTypesFiles,
    errors: generatePossibleTypesErrors
  } = await (0, _possibleTypes.generatePossibleTypes)();
  if (config.graphql.trustedDocuments) {
    const preset = await (0, _clientPreset.generateClientPreset)();
    clientPresetFiles.push(...preset.clientPresetFiles);
  }
  let files = [];
  if (schemaPath !== '') {
    files.push(schemaPath);
  }
  files = (0, _filter.default)(_context = [...files, ...typeDefFiles, ...clientPresetFiles, ...possibleTypesFiles]).call(_context, x => typeof x === 'string');
  return {
    files,
    errors: [...generateGraphQLSchemaErrors, ...generateTypeDefsErrors, ...generatePossibleTypesErrors]
  };
};
exports.generate = generate;
const run = async () => {
  console.log('Generating...');
  console.log();
  const {
    files,
    errors
  } = await generate();
  const rwjsPaths = (0, _projectConfig.getPaths)();
  for (const f of files) {
    console.log('-', f.replace(rwjsPaths.base + '/', ''));
  }
  console.log();
  if (errors.length === 0) {
    console.log('... done.');
    console.log();
    return;
  }
  process.exitCode ||= 1;
  console.log('... done with errors.');
  console.log();
  for (const {
    message,
    error
  } of errors) {
    console.error(message);
    console.log();
    console.error(error);
    console.log();
  }
};
exports.run = run;
if (require.main === module) {
  run();
}