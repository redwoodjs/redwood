#!/usr/bin/env node
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
var _trim = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/trim"));
var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/date/now"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _chalk = _interopRequireDefault(require("chalk"));
var _chokidar = _interopRequireDefault(require("chokidar"));
var _projectConfig = require("@redwoodjs/project-config");
var _cliLogger = require("../cliLogger");
var _files = require("../files");
var _routes = require("../routes");
var _clientPreset = require("./clientPreset");
var _generate = require("./generate");
var _graphqlCodeGen = require("./graphqlCodeGen");
var _graphqlSchema = require("./graphqlSchema");
var _typeDefinitions = require("./typeDefinitions");
const rwjsPaths = (0, _projectConfig.getPaths)();
const watcher = _chokidar.default.watch('(web|api)/src/**/*.{ts,js,jsx,tsx}', {
  persistent: true,
  ignored: ['node_modules', '.redwood'],
  ignoreInitial: true,
  cwd: rwjsPaths.base,
  awaitWriteFinish: true
});
const action = {
  add: 'Created',
  unlink: 'Deleted',
  change: 'Modified'
};
let routesWarningMessage = '';
process.stdin.on('data', async data => {
  var _context;
  const str = (0, _trim.default)(_context = data.toString()).call(_context).toLowerCase();
  if (str === 'g' || str === 'rs') {
    (0, _cliLogger.cliLogger)('Re-creating TypeScript definitions and GraphQL schemas');
    await (0, _generate.generate)();
  }
});
watcher.on('ready', async () => {
  const start = (0, _now.default)();
  (0, _cliLogger.cliLogger)('Generating full TypeScript definitions and GraphQL schemas');
  const {
    files,
    errors
  } = await (0, _generate.generate)();
  (0, _cliLogger.cliLogger)(`Done.`);
  _cliLogger.cliLogger.debug(`\nCreated ${files.length} in ${(0, _now.default)() - start} ms`);
  if (errors.length > 0) {
    for (const {
      message,
      error
    } of errors) {
      console.error(message);
      console.error(error);
      console.log();
    }
  }
  routesWarningMessage = (0, _routes.warningForDuplicateRoutes)();
  if (routesWarningMessage) {
    console.warn(routesWarningMessage);
  }
}).on('all', async (eventName, p) => {
  var _context2;
  _cliLogger.cliLogger.trace(`File system change: ${_chalk.default.magenta(eventName)} ${_chalk.default.dim(p)}`);
  if (!(0, _includes.default)(_context2 = ['add', 'change', 'unlink']).call(_context2, eventName)) {
    return;
  }
  const eventTigger = eventName;
  const absPath = _path.default.join(rwjsPaths.base, p);

  // Track the time in debug
  const start = (0, _now.default)();
  const finished = type => _cliLogger.cliLogger.debug(action[eventTigger], type + ':', _chalk.default.dim(p), _chalk.default.dim.italic((0, _now.default)() - start + ' ms'));
  if ((0, _includes.default)(absPath).call(absPath, 'Cell') && (0, _files.isCellFile)(absPath)) {
    await (0, _graphqlCodeGen.generateTypeDefGraphQLWeb)();
    await (0, _clientPreset.generateClientPreset)();
    if (eventName === 'unlink') {
      _fs.default.unlinkSync((0, _typeDefinitions.mirrorPathForCell)(absPath, rwjsPaths)[0]);
    } else {
      (0, _typeDefinitions.generateMirrorCell)(absPath, rwjsPaths);
    }
    finished('Cell');
  } else if (absPath === rwjsPaths.web.routes) {
    (0, _typeDefinitions.generateTypeDefRouterRoutes)();
    routesWarningMessage = (0, _routes.warningForDuplicateRoutes)();
    finished('Routes');
  } else if ((0, _includes.default)(absPath).call(absPath, 'Page') && (0, _files.isPageFile)(absPath)) {
    (0, _typeDefinitions.generateTypeDefRouterPages)();
    finished('Page');
  } else if ((0, _files.isDirectoryNamedModuleFile)(absPath)) {
    if (eventName === 'unlink') {
      _fs.default.unlinkSync((0, _typeDefinitions.mirrorPathForDirectoryNamedModules)(absPath, rwjsPaths)[0]);
    } else {
      (0, _typeDefinitions.generateMirrorDirectoryNamedModule)(absPath, rwjsPaths);
    }
    finished('Directory named module');
  } else if ((0, _files.isGraphQLSchemaFile)(absPath)) {
    await (0, _graphqlSchema.generateGraphQLSchema)();
    await (0, _graphqlCodeGen.generateTypeDefGraphQLApi)();
    finished('GraphQL Schema');
  }
  if (routesWarningMessage) {
    console.warn(routesWarningMessage);
  }
});