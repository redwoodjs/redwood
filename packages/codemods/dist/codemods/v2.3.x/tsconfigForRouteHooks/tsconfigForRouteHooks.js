"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addApiAliasToTsConfig;
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _projectConfig = require("@redwoodjs/project-config");
var _prettify = _interopRequireDefault(require("../../../lib/prettify"));
async function addApiAliasToTsConfig() {
  // Ts is a heavy import, lets do it dynamically
  const ts = await import('typescript');
  const webConfigPath = ts.findConfigFile((0, _projectConfig.getPaths)().web.base, ts.sys.fileExists);
  if (!webConfigPath) {
    throw new Error('Could not find tsconfig.json in your web side. Please follow release notes to update your config manually.');
  }

  // Use this function, because tsconfigs can be JSONC (json with comments), but also can have trailing commas, etc.
  // Also why I'm not using jscodeshift here - sadly I can't preserve the comments
  const {
    config: webConfig
  } = ts.parseConfigFileTextToJson(webConfigPath, ts.sys.readFile(webConfigPath) // If file exists, it has contents
  );
  if (webConfig?.compilerOptions) {
    const newPathAliases = {
      ...webConfig.compilerOptions.paths,
      '$api/*': ['../api/*']
    };
    const updatedConfig = {
      ...webConfig,
      compilerOptions: {
        ...webConfig.compilerOptions,
        paths: newPathAliases
      }
    };
    ts.sys.writeFile(webConfigPath,
    // @NOTE: prettier will remove trailing commas, but whatever
    await (0, _prettify.default)((0, _stringify.default)(updatedConfig), {
      parser: 'json'
    }));
  } else {
    throw new Error('Could not read your web/tsconfig.json. Please follow release notes to update your config manually.');
  }
}