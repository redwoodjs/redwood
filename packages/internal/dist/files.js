"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.isPageFile = exports.isGraphQLSchemaFile = exports.isFileInsideFolder = exports.isDirectoryNamedModuleFile = exports.isCellFile = exports.isApiFunction = exports.findWebFiles = exports.findScripts = exports.findRouteHooksSrc = exports.findPages = exports.findGraphQLSchemas = exports.findDirectoryNamedModules = exports.findCells = exports.findApiServerFunctions = exports.findApiFiles = exports.findApiDistFunctions = void 0;
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _endsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/ends-with"));
var _findIndex = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find-index"));
var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/starts-with"));
var _path = _interopRequireDefault(require("path"));
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _projectConfig = require("@redwoodjs/project-config");
var _ast = require("./ast");
const findCells = (cwd = (0, _projectConfig.getPaths)().web.src) => {
  const modules = _fastGlob.default.sync('**/*Cell.{js,jsx,ts,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules']
  });
  return (0, _filter.default)(modules).call(modules, isCellFile);
};
exports.findCells = findCells;
const findPages = (cwd = (0, _projectConfig.getPaths)().web.pages) => {
  const modules = _fastGlob.default.sync('**/*Page.{tsx,js,jsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules']
  });
  return (0, _filter.default)(modules).call(modules, isPageFile);
};

/**
 * This function finds all modules in the 'web' and 'api' directories excluding 'node_modules' and Cell files.
 * Cell files are also directory named modules but they have their special type mirror file, so they are ignored.
 *
 * @param {string} cwd - The directory path to start searching from. By default, it is the base path of the project.
 * @returns {Array} modules - An array of absolute paths for the found modules.
 *
 * @example
 * // Assuming the base directory of your project is '/Users/user/myproject'
 * findDirectoryNamedModules('/Users/user/myproject');
 * // This will return an array with the absolute paths of all matching files, e.g.:
 * // ['/Users/user/myproject/web/src/components/Author/Author.tsx', '/Users/user/myproject/web/src/pages/AboutPage/AboutPage.tsx']
 */
exports.findPages = findPages;
const findDirectoryNamedModules = (cwd = (0, _projectConfig.getPaths)().base) => {
  var _context;
  const modules = _fastGlob.default.sync('(api|web)/src/**/*.{ts,js,jsx,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules']
  });
  return (0, _filter.default)(_context = (0, _filter.default)(modules).call(modules, isDirectoryNamedModuleFile)).call(_context, p => !isCellFile(p));
};
exports.findDirectoryNamedModules = findDirectoryNamedModules;
const findGraphQLSchemas = (cwd = (0, _projectConfig.getPaths)().api.graphql) => {
  var _context2;
  return (0, _filter.default)(_context2 = _fastGlob.default.sync('**/*.sdl.{ts,js}', {
    cwd,
    absolute: true
  })).call(_context2, isGraphQLSchemaFile);
};
exports.findGraphQLSchemas = findGraphQLSchemas;
const ignoreApiFiles = ['**/*.test.{js,ts}', '**/*.scenarios.{js,ts}', '**/*.fixtures.{js,ts}', '**/*.d.ts'];
const findApiFiles = (cwd = (0, _projectConfig.getPaths)().api.src) => {
  const files = _fastGlob.default.sync('**/*.{js,ts,jsx,tsx}', {
    cwd,
    absolute: true,
    ignore: ignoreApiFiles
  });
  return files;
};
exports.findApiFiles = findApiFiles;
const findWebFiles = (cwd = (0, _projectConfig.getPaths)().web.src) => {
  const files = _fastGlob.default.sync('**/*.{js,ts,jsx,tsx}', {
    cwd,
    absolute: true,
    ignore: ['**/*.test.{js,ts,tsx,jsx}', '**/*.fixtures.{js,ts,tsx,jsx}', '**/*.mock.{js,ts,tsx,jsx}', '**/*.d.ts']
  });
  return files;
};
exports.findWebFiles = findWebFiles;
const findApiServerFunctions = (cwd = (0, _projectConfig.getPaths)().api.functions) => {
  const files = _fastGlob.default.sync('**/*.{js,ts}', {
    cwd,
    absolute: true,
    deep: 2,
    // We don't support deeply nested api functions.
    ignore: ignoreApiFiles
  });
  return (0, _filter.default)(files).call(files, f => isApiFunction(f, cwd));
};
exports.findApiServerFunctions = findApiServerFunctions;
const findApiDistFunctions = (cwd = (0, _projectConfig.getPaths)().api.base) => {
  return _fastGlob.default.sync('dist/functions/**/*.{ts,js}', {
    cwd,
    deep: 2,
    // We don't support deeply nested api functions, to maximise compatibility with deployment providers
    absolute: true
  });
};
exports.findApiDistFunctions = findApiDistFunctions;
const findRouteHooksSrc = (cwd = (0, _projectConfig.getPaths)().web.src) => {
  return _fastGlob.default.sync('**/*.routeHooks.{js,ts,tsx,jsx}', {
    absolute: true,
    cwd
  });
};
exports.findRouteHooksSrc = findRouteHooksSrc;
const isCellFile = p => {
  const {
    dir,
    name
  } = _path.default.parse(p);

  // If the path isn't on the web side it cannot be a cell
  if (!isFileInsideFolder(p, (0, _projectConfig.getPaths)().web.src)) {
    return false;
  }

  // A Cell must be a directory named module.
  if (!(0, _endsWith.default)(dir).call(dir, name)) {
    return false;
  }
  const ast = (0, _ast.fileToAst)(p);

  // A Cell should not have a default export.
  if ((0, _ast.hasDefaultExport)(ast)) {
    return false;
  }

  // A Cell must export QUERY and Success.
  const exports = (0, _ast.getNamedExports)(ast);
  const exportedQUERY = (0, _findIndex.default)(exports).call(exports, v => v.name === 'QUERY') !== -1;
  const exportedSuccess = (0, _findIndex.default)(exports).call(exports, v => v.name === 'Success') !== -1;
  if (!exportedQUERY && !exportedSuccess) {
    return false;
  }
  return true;
};
exports.isCellFile = isCellFile;
const findScripts = (cwd = (0, _projectConfig.getPaths)().scripts) => {
  return _fastGlob.default.sync('./**/*.{js,jsx,ts,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules']
  });
};
exports.findScripts = findScripts;
const isPageFile = p => {
  const {
    name
  } = _path.default.parse(p);

  // A page must end with "Page.{jsx,js,tsx}".
  if (!(0, _endsWith.default)(name).call(name, 'Page')) {
    return false;
  }

  // A page should be in the `web/src/pages` directory.
  if (!isFileInsideFolder(p, (0, _projectConfig.getPaths)().web.pages)) {
    return false;
  }

  // A Page should have a default export.
  const ast = (0, _ast.fileToAst)(p);
  if (!(0, _ast.hasDefaultExport)(ast)) {
    return false;
  }
  return true;
};
/**
 * This function checks if the given path belongs to a directory named module.
 * A directory named module is where the filename (without extension) is the same as the directory it is in.
 *
 * @param {string} p - The absolute path of the file.
 * @returns {boolean} - Returns true if the path belongs to a directory named module, false otherwise.
 *
 * @example
 * isDirectoryNamedModuleFile('/Users/user/myproject/web/src/components/Author/Author.tsx');
 * // Returns: true
 *
 * isDirectoryNamedModuleFile('/Users/user/myproject/web/src/components/Author/AuthorInfo.tsx');
 * // Returns: false
 */
exports.isPageFile = isPageFile;
const isDirectoryNamedModuleFile = p => {
  const {
    dir,
    name
  } = _path.default.parse(p);
  return (0, _endsWith.default)(dir).call(dir, name);
};
exports.isDirectoryNamedModuleFile = isDirectoryNamedModuleFile;
const isGraphQLSchemaFile = p => {
  if (!p.match(/\.sdl\.(ts|js)$/)?.[0]) {
    return false;
  }
  const ast = (0, _ast.fileToAst)(p);
  const exports = (0, _ast.getNamedExports)(ast);
  return (0, _findIndex.default)(exports).call(exports, v => v.name === 'schema') !== -1;
};

/**
 * The following patterns are supported for api functions:
 *
 * 1. a module at the top level: `/graphql.js`
 * 2. a module in a folder with a module of the same name: `/health/health.js`
 * 3. a module in a folder named index: `/x/index.js`
 */
exports.isGraphQLSchemaFile = isGraphQLSchemaFile;
const isApiFunction = (p, functionsPath) => {
  p = _path.default.relative(functionsPath, p);
  const {
    dir,
    name
  } = _path.default.parse(p);
  if (dir === name) {
    // Directory named module
    return true;
  } else if (dir === '') {
    // Module in the functions root
    return true;
  } else if (dir.length && name === 'index') {
    // Directory with an `index.js` file
    return true;
  }
  return false;
};
exports.isApiFunction = isApiFunction;
const isFileInsideFolder = (filePath, folderPath) => {
  const {
    dir
  } = _path.default.parse(filePath);
  const relativePathFromFolder = _path.default.relative(folderPath, dir);
  if (!relativePathFromFolder || (0, _startsWith.default)(relativePathFromFolder).call(relativePathFromFolder, '..') || _path.default.isAbsolute(relativePathFromFolder)) {
    return false;
  } else {
    return true;
  }
};
exports.isFileInsideFolder = isFileInsideFolder;