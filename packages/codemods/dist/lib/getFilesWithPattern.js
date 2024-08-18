"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ripgrep = require("@vscode/ripgrep");
var _execa = _interopRequireDefault(require("execa"));
/**
 * Uses ripgrep to search files for a pattern,
 * returning the name of the files that contain the pattern.
 *
 * @see {@link https://github.com/burntsushi/ripgrep}
 */

const getFilesWithPattern = ({
  pattern,
  filesToSearch
}) => {
  try {
    const {
      stdout
    } = _execa.default.sync(_ripgrep.rgPath, ['--files-with-matches', pattern, ...filesToSearch]);

    /**
     * Return an array of files that contain the pattern
     */
    return stdout.toString().split('\n');
  } catch {
    return [];
  }
};
var _default = exports.default = getFilesWithPattern;