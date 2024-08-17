#!/usr/bin/env node
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
var generate_exports = {};
__export(generate_exports, {
  generate: () => generate,
  run: () => run
});
module.exports = __toCommonJS(generate_exports);
var import_project_config = require("@redwoodjs/project-config");
var import_clientPreset = require("./clientPreset");
var import_graphqlSchema = require("./graphqlSchema");
var import_possibleTypes = require("./possibleTypes");
var import_typeDefinitions = require("./typeDefinitions");
const generate = async () => {
  const config = (0, import_project_config.getConfig)();
  const { schemaPath, errors: generateGraphQLSchemaErrors } = await (0, import_graphqlSchema.generateGraphQLSchema)();
  const { typeDefFiles, errors: generateTypeDefsErrors } = await (0, import_typeDefinitions.generateTypeDefs)();
  const clientPresetFiles = [];
  const { possibleTypesFiles, errors: generatePossibleTypesErrors } = await (0, import_possibleTypes.generatePossibleTypes)();
  if (config.graphql.trustedDocuments) {
    const preset = await (0, import_clientPreset.generateClientPreset)();
    clientPresetFiles.push(...preset.clientPresetFiles);
  }
  let files = [];
  if (schemaPath !== "") {
    files.push(schemaPath);
  }
  files = [
    ...files,
    ...typeDefFiles,
    ...clientPresetFiles,
    ...possibleTypesFiles
  ].filter((x) => typeof x === "string");
  return {
    files,
    errors: [
      ...generateGraphQLSchemaErrors,
      ...generateTypeDefsErrors,
      ...generatePossibleTypesErrors
    ]
  };
};
const run = async () => {
  console.log("Generating...");
  console.log();
  const { files, errors } = await generate();
  const rwjsPaths = (0, import_project_config.getPaths)();
  for (const f of files) {
    console.log("-", f.replace(rwjsPaths.base + "/", ""));
  }
  console.log();
  if (errors.length === 0) {
    console.log("... done.");
    console.log();
    return;
  }
  process.exitCode ||= 1;
  console.log("... done with errors.");
  console.log();
  for (const { message, error } of errors) {
    console.error(message);
    console.log();
    console.error(error);
    console.log();
  }
};
if (require.main === module) {
  run();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generate,
  run
});
