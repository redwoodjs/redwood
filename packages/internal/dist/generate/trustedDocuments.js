"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.trustedDocumentsStore = exports.replaceGqlTagWithTrustedDocumentGraphql = void 0;
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _endsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/ends-with"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _prettier = require("prettier");
var _projectConfig = require("@redwoodjs/project-config");
// Copy the persisted-documents.json to api side as a trustedDocumentsStore
const trustedDocumentsStore = async generatedFiles => {
  let trustedDocumentsStoreFile = '';
  const output = (0, _filter.default)(generatedFiles).call(generatedFiles, f => {
    var _context;
    return (0, _endsWith.default)(_context = f.filename).call(_context, 'persisted-documents.json');
  });
  const storeFile = output[0];
  if (storeFile?.content) {
    const content = await (0, _prettier.format)(`export const store = ${storeFile.content}`, {
      trailingComma: 'es5',
      bracketSpacing: true,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      arrowParens: 'always',
      parser: 'typescript'
    });
    trustedDocumentsStoreFile = _path.default.join((0, _projectConfig.getPaths)().api.lib, 'trustedDocumentsStore.ts');
    _fs.default.mkdirSync(_path.default.dirname(trustedDocumentsStoreFile), {
      recursive: true
    });
    _fs.default.writeFileSync(trustedDocumentsStoreFile, content);
  }
  return trustedDocumentsStoreFile;
};

// Add the gql function to the generated graphql.ts file
// that is used by trusted documents
exports.trustedDocumentsStore = trustedDocumentsStore;
const replaceGqlTagWithTrustedDocumentGraphql = async generatedFiles => {
  const gqlFileOutput = (0, _filter.default)(generatedFiles).call(generatedFiles, f => {
    var _context2;
    return (0, _endsWith.default)(_context2 = f.filename).call(_context2, 'gql.ts');
  });
  const gqlFile = gqlFileOutput[0];
  if (gqlFile?.content) {
    gqlFile.content += `\n
      export function gql(source: string | TemplateStringsArray) {
        if (typeof source === 'string') {
          return graphql(source)
        }

        return graphql(source.join('\\n'))
      }`;
    const content = await (0, _prettier.format)(gqlFile.content, {
      trailingComma: 'es5',
      bracketSpacing: true,
      tabWidth: 2,
      semi: true,
      singleQuote: false,
      arrowParens: 'always',
      parser: 'typescript'
    });
    _fs.default.writeFileSync(gqlFile.filename, content);
  }
};
exports.replaceGqlTagWithTrustedDocumentGraphql = replaceGqlTagWithTrustedDocumentGraphql;