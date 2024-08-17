"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldGenerateTrustedDocuments = exports.generateClientPreset = void 0;
require("core-js/modules/es.array.push.js");
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _cli = require("@graphql-codegen/cli");
var _clientPreset = require("@graphql-codegen/client-preset");
var _projectConfig = require("@redwoodjs/project-config");
var _trustedDocuments = require("./trustedDocuments");
const shouldGenerateTrustedDocuments = () => {
  const config = (0, _projectConfig.getConfig)();
  return config.graphql.trustedDocuments;
};
exports.shouldGenerateTrustedDocuments = shouldGenerateTrustedDocuments;
const generateClientPreset = async () => {
  let generatedFiles = [];
  let clientPresetFiles = [];
  const errors = [];
  if (!shouldGenerateTrustedDocuments()) {
    return {
      clientPresetFiles,
      trustedDocumentsStoreFile: [],
      errors
    };
  }
  const documentsGlob = `${(0, _projectConfig.getPaths)().web.src}/**/!(*.d).{ts,tsx,js,jsx}`;
  const config = {
    schema: (0, _projectConfig.getPaths)().generated.schema,
    documents: documentsGlob,
    silent: true,
    // Plays nicely with cli task output
    generates: {
      [`${(0, _projectConfig.getPaths)().web.src}/graphql/`]: {
        preset: 'client',
        presetConfig: {
          persistedDocuments: true
        },
        documentTransforms: [_clientPreset.addTypenameSelectionDocumentTransform],
        config: {
          // DO NOT USE documentMode: 'string',
        }
      }
    }
  };
  try {
    generatedFiles = await (0, _cli.generate)(config, true);
    clientPresetFiles = (0, _map.default)(generatedFiles).call(generatedFiles, f => f.filename);
    const trustedDocumentsStoreFile = await (0, _trustedDocuments.trustedDocumentsStore)(generatedFiles);
    (0, _trustedDocuments.replaceGqlTagWithTrustedDocumentGraphql)(generatedFiles);
    return {
      clientPresetFiles,
      trustedDocumentsStoreFile,
      errors
    };
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL client preset',
      error: e
    });
    return {
      clientPresetFiles,
      trustedDocumentsStoreFile: [],
      errors
    };
  }
};
exports.generateClientPreset = generateClientPreset;