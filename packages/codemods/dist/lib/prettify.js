"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _prettier = require("prettier");
var _projectConfig = require("@redwoodjs/project-config");
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
const prettify = async (code, options = {}) => {
  const prettierConfig = await getPrettierConfig();
  return (0, _prettier.format)(code, {
    singleQuote: true,
    semi: false,
    ...prettierConfig,
    parser: 'babel',
    ...options
  });
};
var _default = exports.default = prettify;