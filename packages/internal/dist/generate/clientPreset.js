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
var clientPreset_exports = {};
__export(clientPreset_exports, {
  generateClientPreset: () => generateClientPreset,
  shouldGenerateTrustedDocuments: () => shouldGenerateTrustedDocuments
});
module.exports = __toCommonJS(clientPreset_exports);
var import_cli = require("@graphql-codegen/cli");
var import_client_preset = require("@graphql-codegen/client-preset");
var import_project_config = require("@redwoodjs/project-config");
var import_trustedDocuments = require("./trustedDocuments");
const shouldGenerateTrustedDocuments = () => {
  const config = (0, import_project_config.getConfig)();
  return config.graphql.trustedDocuments;
};
const generateClientPreset = async () => {
  let generatedFiles = [];
  let clientPresetFiles = [];
  const errors = [];
  if (!shouldGenerateTrustedDocuments()) {
    return { clientPresetFiles, trustedDocumentsStoreFile: [], errors };
  }
  const documentsGlob = `${(0, import_project_config.getPaths)().web.src}/**/!(*.d).{ts,tsx,js,jsx}`;
  const config = {
    schema: (0, import_project_config.getPaths)().generated.schema,
    documents: documentsGlob,
    silent: true,
    // Plays nicely with cli task output
    generates: {
      [`${(0, import_project_config.getPaths)().web.src}/graphql/`]: {
        preset: "client",
        presetConfig: {
          persistedDocuments: true
        },
        documentTransforms: [import_client_preset.addTypenameSelectionDocumentTransform],
        config: {
          // DO NOT USE documentMode: 'string',
        }
      }
    }
  };
  try {
    generatedFiles = await (0, import_cli.generate)(config, true);
    clientPresetFiles = generatedFiles.map((f) => f.filename);
    const trustedDocumentsStoreFile = await (0, import_trustedDocuments.trustedDocumentsStore)(generatedFiles);
    (0, import_trustedDocuments.replaceGqlTagWithTrustedDocumentGraphql)(generatedFiles);
    return {
      clientPresetFiles,
      trustedDocumentsStoreFile,
      errors
    };
  } catch (e) {
    errors.push({
      message: "Error: Could not generate GraphQL client preset",
      error: e
    });
    return {
      clientPresetFiles,
      trustedDocumentsStoreFile: [],
      errors
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateClientPreset,
  shouldGenerateTrustedDocuments
});
