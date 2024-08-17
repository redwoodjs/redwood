"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.typeScriptSourceFiles = exports.transformTSToJS = exports.prettify = exports.getPrettierConfig = exports.convertTsScriptsToJs = exports.convertTsProjectToJs = exports.convertTsFilesToJs = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _core = require("@babel/core");
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _prettier = require("prettier");
var _projectConfig = require("@redwoodjs/project-config");
/**
 * Converts all the TypeScript files in the `api` and `web` sides to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
const convertTsProjectToJs = (cwd = (0, _projectConfig.getPaths)().base) => {
  const files = typeScriptSourceFiles(cwd);
  convertTsFilesToJs(cwd, files);
};

/**
 * Converts all the TypeScript files in the `api` and `web` sides to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
exports.convertTsProjectToJs = convertTsProjectToJs;
const convertTsScriptsToJs = (cwd = (0, _projectConfig.getPaths)().base) => {
  const files = typeScriptSourceFiles(cwd, 'scripts/*.{ts,tsx}');
  convertTsFilesToJs(cwd, files);
};

/**
 * Converts TypeScript files to JavaScript.
 *
 * @param {string} cwd - Current directory
 * @param {string[]} files - Collection of files to convert
 */
exports.convertTsScriptsToJs = convertTsScriptsToJs;
const convertTsFilesToJs = async (cwd, files) => {
  if (files.length === 0) {
    console.log('No TypeScript files found to convert to JS in this project.');
  }
  for (const f of files) {
    const code = await transformTSToJS(f);
    if (code) {
      _fs.default.writeFileSync(_path.default.join(cwd, f.replace('.tsx', '.jsx').replace('.ts', '.js')), code, 'utf8');
      _fs.default.unlinkSync(_path.default.join(cwd, f));
    }
  }
  if (_fs.default.existsSync(_path.default.join(cwd, 'api/tsconfig.json'))) {
    _fs.default.renameSync(_path.default.join(cwd, 'api/tsconfig.json'), _path.default.join(cwd, 'api/jsconfig.json'));
  }
  if (_fs.default.existsSync(_path.default.join(cwd, 'web/tsconfig.json'))) {
    _fs.default.renameSync(_path.default.join(cwd, 'web/tsconfig.json'), _path.default.join(cwd, 'web/jsconfig.json'));
  }
  if (_fs.default.existsSync(_path.default.join(cwd, 'scripts/tsconfig.json'))) {
    _fs.default.renameSync(_path.default.join(cwd, 'scripts/tsconfig.json'), _path.default.join(cwd, 'scripts/jsconfig.json'));
  }
};

/**
 * Get all the source code from a Redwood project
 */
exports.convertTsFilesToJs = convertTsFilesToJs;
const typeScriptSourceFiles = (cwd, globPattern = '{api,web}/src/**/*.{ts,tsx}') => {
  console.log(globPattern);
  // TODO: When sides are expanded read the `api` and `web` string instead
  // of hard-coding them.
  return _fastGlob.default.sync(globPattern, {
    cwd,
    ignore: ['node_modules']
  });
};

/**
 * Read the contents of a TypeScript file, transpile it to JavaScript,
 * but leave the JSX intact and format via Prettier.
 *
 * @param {string} file - The path to the TypeScript file.
 */
exports.typeScriptSourceFiles = typeScriptSourceFiles;
const transformTSToJS = file => {
  const tsCode = _fs.default.readFileSync(file, 'utf8');
  const filename = _path.default.basename(file);
  const result = (0, _core.transform)(tsCode, {
    filename,
    cwd: (0, _projectConfig.getPaths)().base,
    configFile: false,
    plugins: [['@babel/plugin-transform-typescript', {
      isTSX: true,
      allExtensions: true
    }]],
    retainLines: true
  });
  if (!result?.code) {
    return undefined;
  }
  return prettify(result.code, filename.replace(/\.ts$/, '.js'));
};
exports.transformTSToJS = transformTSToJS;
const getPrettierConfig = async () => {
  try {
    const {
      default: prettierConfig
    } = await import(`file://${_path.default.join((0, _projectConfig.getPaths)().base, 'prettier.config.js')}`);
    return prettierConfig;
  } catch {
    return undefined;
  }
};

/**
 * Determine the prettier parser based off of the extension.
 *
 * See: https://prettier.io/docs/en/options.html#parser
 * @param {string} filename
 */
exports.getPrettierConfig = getPrettierConfig;
const prettierParser = filename => {
  switch (_path.default.extname(filename.replace('.template', ''))) {
    case '.css':
      return 'css';
    case '.js':
      return 'babel';
    case '.ts':
    case '.tsx':
      return 'babel-ts';
    default:
      return undefined;
  }
};

/**
 * Prettify `code` according to the extension in `filename`.
 * This will also read a user's `prettier.config.js` file if it exists.
 *
 * @param {string} code
 * @param {string} filename
 */
const prettify = async (code, filename) => {
  const parser = prettierParser(filename);
  // Return unformatted code if we could not determine the parser.
  if (typeof parser === 'undefined') {
    return code;
  }
  const prettierConfig = await getPrettierConfig();
  return (0, _prettier.format)(code, {
    ...prettierConfig,
    parser
  });
};
exports.prettify = prettify;