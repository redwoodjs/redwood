"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.cliLogger = void 0;
var _logger = require("@redwoodjs/api/logger");
// Can't use color in the createLogger logger - so use a simpler set of log fns
const logLevel = _logger.defaultLoggerOptions.level;
/**
 * An alternative to createLogger which supports the same logging levels
 * but allows for full ANSI when printing to the console.
 */
const cliLogger = function (...data) {
  console.log(...data);
};
exports.cliLogger = cliLogger;
cliLogger.trace = logLevel === 'trace' ? console.log : () => {};
cliLogger.debug = logLevel === 'trace' || logLevel === 'debug' ? console.log : () => {};