"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.isTypeScriptProject = exports.isServerFileSetup = exports.isRealtimeSetup = exports.getTsConfigs = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _typescript = require("typescript");
var _projectConfig = require("@redwoodjs/project-config");
const getTsConfigs = () => {
  const rwPaths = (0, _projectConfig.getPaths)();
  const apiTsConfigPath = _path.default.join(rwPaths.api.base, 'tsconfig.json');
  const webTsConfigPath = _path.default.join(rwPaths.web.base, 'tsconfig.json');
  const apiTsConfig = _fs.default.existsSync(apiTsConfigPath) ? (0, _typescript.parseConfigFileTextToJson)(apiTsConfigPath, _fs.default.readFileSync(apiTsConfigPath, 'utf-8')) : null;
  const webTsConfig = _fs.default.existsSync(webTsConfigPath) ? (0, _typescript.parseConfigFileTextToJson)(webTsConfigPath, _fs.default.readFileSync(webTsConfigPath, 'utf-8')) : null;
  return {
    api: apiTsConfig?.config ?? null,
    web: webTsConfig?.config ?? null
  };
};
exports.getTsConfigs = getTsConfigs;
const isTypeScriptProject = () => {
  const paths = (0, _projectConfig.getPaths)();
  return _fs.default.existsSync(_path.default.join(paths.web.base, 'tsconfig.json')) || _fs.default.existsSync(_path.default.join(paths.api.base, 'tsconfig.json'));
};
exports.isTypeScriptProject = isTypeScriptProject;
const isServerFileSetup = () => {
  const serverFilePath = _path.default.join((0, _projectConfig.getPaths)().api.src, `server.${isTypeScriptProject() ? 'ts' : 'js'}`);
  return _fs.default.existsSync(serverFilePath);
};
exports.isServerFileSetup = isServerFileSetup;
const isRealtimeSetup = () => {
  const realtimePath = _path.default.join((0, _projectConfig.getPaths)().api.lib, `realtime.${isTypeScriptProject() ? 'ts' : 'js'}`);
  return _fs.default.existsSync(realtimePath);
};
exports.isRealtimeSetup = isRealtimeSetup;