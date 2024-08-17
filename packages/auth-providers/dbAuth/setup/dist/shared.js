"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.addModels = addModels;
exports.functionsPath = void 0;
exports.generateAuthPagesTask = generateAuthPagesTask;
exports.getModelNames = void 0;
exports.hasAuthPages = hasAuthPages;
exports.libPath = exports.hasModel = void 0;
require("core-js/modules/es.array.push.js");
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _some = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/some"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _internals = require("@prisma/internals");
var _execa = _interopRequireDefault(require("execa"));
var _cliHelpers = require("@redwoodjs/cli-helpers");
var _projectConfig = require("@redwoodjs/project-config");
const libPath = exports.libPath = (0, _cliHelpers.getPaths)().api.lib.replace((0, _cliHelpers.getPaths)().base, '');
const functionsPath = exports.functionsPath = (0, _cliHelpers.getPaths)().api.functions.replace((0, _cliHelpers.getPaths)().base, '');
const getModelNames = async () => {
  var _context;
  const datamodel = await (0, _internals.getSchema)((0, _cliHelpers.getPaths)().api.dbSchema);
  const schema = await (0, _internals.getDMMF)({
    datamodel
  });
  return (0, _map.default)(_context = schema.datamodel.models).call(_context, model => model.name);
};
exports.getModelNames = getModelNames;
const hasModel = async name => {
  var _context2;
  if (!name) {
    return false;
  }

  // Support PascalCase, camelCase, kebab-case, UPPER_CASE, and lowercase model
  // names
  const modelName = name.replace(/[_-]/g, '').toLowerCase();
  const modelNames = (0, _map.default)(_context2 = await getModelNames()).call(_context2, name => name.toLowerCase());
  if ((0, _includes.default)(modelNames).call(modelNames, modelName)) {
    return true;
  }
  return false;
};
exports.hasModel = hasModel;
async function addModels(models) {
  const isDirectory = _nodeFs.default.statSync((0, _cliHelpers.getPaths)().api.dbSchema).isDirectory();
  if (isDirectory) {
    _nodeFs.default.writeFileSync(_nodePath.default.join((0, _cliHelpers.getPaths)().api.dbSchema, 'user.prisma'), models);
  } else {
    _nodeFs.default.appendFileSync((0, _cliHelpers.getPaths)().api.dbSchema, models);
  }
}
function hasAuthPages() {
  var _context3;
  const routes = _nodeFs.default.readFileSync((0, _cliHelpers.getPaths)().web.routes, 'utf-8');

  // If the user already has a route for /login, /signin, or /signup, we
  // assume auth pages are already set up
  if (/path={?['"]\/(login|signin|signup)['"]}? /i.test(routes)) {
    return true;
  }
  return (0, _some.default)(_context3 = (0, _projectConfig.processPagesDir)()).call(_context3, page => {
    if (page.importName === 'LoginPage' || page.importName === 'LogInPage' || page.importName === 'SigninPage' || page.importName === 'SignInPage' || page.importName === 'SignupPage' || page.importName === 'SignUpPage') {
      return true;
    }
    return false;
  });
}
function generateAuthPagesTask(generatingUserModel) {
  return {
    title: 'Adding dbAuth pages...',
    task: async () => {
      const rwjsPaths = (0, _cliHelpers.getPaths)();
      const args = ['rw', 'g', 'dbAuth'];
      if (generatingUserModel) {
        args.push('--username-label', 'username', '--password-label', 'password');
      }
      await (0, _execa.default)('yarn', args, {
        stdio: 'inherit',
        shell: true,
        cwd: rwjsPaths.base
      });
    }
  };
}