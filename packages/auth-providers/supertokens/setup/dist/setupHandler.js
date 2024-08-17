"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.addRoutingLogic = void 0;
exports.handler = handler;
var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/reduce"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
require("core-js/modules/es.array.push.js");
require("core-js/modules/esnext.json.parse.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _cliHelpers = require("@redwoodjs/cli-helpers");
async function handler({
  force: forceArg
}) {
  const {
    version
  } = JSON.parse(_fs.default.readFileSync(_path.default.resolve(__dirname, '../package.json'), 'utf-8'));
  (0, _cliHelpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    provider: 'supertokens',
    authDecoderImport: "import { authDecoder } from '@redwoodjs/auth-supertokens-api'",
    apiPackages: [`@redwoodjs/auth-supertokens-api@${version}`, 'supertokens-node@^15'],
    webPackages: [`@redwoodjs/auth-supertokens-web@${version}`, 'supertokens-auth-react@~0.34.0', 'supertokens-web-js@~0.7.0'],
    extraTasks: [addRoutingLogic],
    notes: ["We've implemented SuperToken's EmailPassword with Social / Enterprise (OAuth 2.0, SAML) login recipe,", 'but feel free to switch to something that better fits your needs. See https://supertokens.com/docs/guides.', '', "To get things working, you'll need to add quite a few env vars to your .env file.", 'See https://redwoodjs.com/docs/auth/supertokens for a full walkthrough.']
  });
}

// Exported for testing.
const addRoutingLogic = exports.addRoutingLogic = {
  title: `Adding SuperTokens routing logic to Routes.{jsx,tsx}...`,
  task: () => {
    const routesPath = (0, _cliHelpers.getPaths)().web.routes;
    let content = _fs.default.readFileSync(routesPath, 'utf-8');

    // Remove the old setup if it's there.
    content = content.replace("import SuperTokens from 'supertokens-auth-react'", '').replace(/if \(SuperTokens.canHandleRoute\(\)\) {[^}]+}/, '');
    if (!/\s*if\s*\(canHandleRoute\(PreBuiltUI\)\)\s*\{/.test(content)) {
      var _context;
      let hasImportedSuperTokensFunctions = false;
      content = (0, _reduce.default)(_context = content.split('\n')).call(_context, (acc, line) => {
        // Add the SuperTokens import before the first import from a RedwoodJS package.
        if (!hasImportedSuperTokensFunctions && (0, _includes.default)(line).call(line, 'import') && (0, _includes.default)(line).call(line, '@redwoodjs')) {
          acc.push("import { canHandleRoute, getRoutingComponent } from 'supertokens-auth-react/ui'");
          acc.push('');
          hasImportedSuperTokensFunctions = true;
        }
        acc.push(line);
        return acc;
      }, []).join('\n');
      content = content.replace("import { useAuth } from './auth'", "import { useAuth, PreBuiltUI } from './auth'");
      content = content.replace(/const Routes = \(\) => \{\n/, 'const Routes = () => {\n' + '  if (canHandleRoute(PreBuiltUI)) {\n' + '    return getRoutingComponent(PreBuiltUI)\n' + '  }\n\n');
      _fs.default.writeFileSync(routesPath, content);
    }
  }
};