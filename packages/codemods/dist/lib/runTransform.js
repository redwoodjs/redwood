"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.runTransform = exports.default = void 0;
var jscodeshift = _interopRequireWildcard(require("jscodeshift/src/Runner"));
/**
 * A simple wrapper around the jscodeshift.
 *
 * @see jscodeshift CLI's usage {@link https://github.com/facebook/jscodeshift#usage-cli}
 * @see prisma/codemods {@link https://github.com/prisma/codemods/blob/main/utils/runner.ts}
 * @see react-codemod {@link https://github.com/reactjs/react-codemod/blob/master/bin/cli.js}
 */

const defaultJscodeshiftOpts = {
  verbose: 0,
  dry: false,
  print: false,
  babel: true,
  ignorePattern: '**/node_modules/**',
  ignoreConfig: [],
  runInBand: false,
  silent: false,
  parser: 'babel',
  parserConfig: {},
  failOnError: false,
  stdin: false
};
const runTransform = async ({
  transformPath,
  targetPaths,
  parser = 'tsx',
  options = {}
}) => {
  try {
    // We have to do this here for the tests, because jscodeshift.run actually spawns
    // a different process. If we use getPaths() in the transform, it would not find redwood.toml
    if (process.env.NODE_ENV === 'test' && process.env.RWJS_CWD) {
      process.chdir(process.env.RWJS_CWD);
    }
    await jscodeshift.run(transformPath, targetPaths, {
      ...defaultJscodeshiftOpts,
      parser,
      babel: process.env.NODE_ENV === 'test',
      ...options // Putting options here lets them override all the defaults.
    });
  } catch (e) {
    console.error('Transform Error', e.message);
    throw new Error('Failed to invoke transform');
  }
};
exports.runTransform = runTransform;
var _default = exports.default = runTransform;