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
var trustedDocuments_exports = {};
__export(trustedDocuments_exports, {
  replaceGqlTagWithTrustedDocumentGraphql: () => replaceGqlTagWithTrustedDocumentGraphql,
  trustedDocumentsStore: () => trustedDocumentsStore
});
module.exports = __toCommonJS(trustedDocuments_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_prettier = require("prettier");
var import_project_config = require("@redwoodjs/project-config");
const trustedDocumentsStore = async (generatedFiles) => {
  let trustedDocumentsStoreFile = "";
  const output = generatedFiles.filter(
    (f) => f.filename.endsWith("persisted-documents.json")
  );
  const storeFile = output[0];
  if (storeFile?.content) {
    const content = await (0, import_prettier.format)(`export const store = ${storeFile.content}`, {
      trailingComma: "es5",
      bracketSpacing: true,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      arrowParens: "always",
      parser: "typescript"
    });
    trustedDocumentsStoreFile = import_path.default.join(
      (0, import_project_config.getPaths)().api.lib,
      "trustedDocumentsStore.ts"
    );
    import_fs.default.mkdirSync(import_path.default.dirname(trustedDocumentsStoreFile), { recursive: true });
    import_fs.default.writeFileSync(trustedDocumentsStoreFile, content);
  }
  return trustedDocumentsStoreFile;
};
const replaceGqlTagWithTrustedDocumentGraphql = async (generatedFiles) => {
  const gqlFileOutput = generatedFiles.filter(
    (f) => f.filename.endsWith("gql.ts")
  );
  const gqlFile = gqlFileOutput[0];
  if (gqlFile?.content) {
    gqlFile.content += `

      export function gql(source: string | TemplateStringsArray) {
        if (typeof source === 'string') {
          return graphql(source)
        }

        return graphql(source.join('\\n'))
      }`;
    const content = await (0, import_prettier.format)(gqlFile.content, {
      trailingComma: "es5",
      bracketSpacing: true,
      tabWidth: 2,
      semi: true,
      singleQuote: false,
      arrowParens: "always",
      parser: "typescript"
    });
    import_fs.default.writeFileSync(gqlFile.filename, content);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  replaceGqlTagWithTrustedDocumentGraphql,
  trustedDocumentsStore
});
