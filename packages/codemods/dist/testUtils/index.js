"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.formatCode = exports.createProjectMock = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _prettier = require("prettier");
var _parserBabel = _interopRequireDefault(require("prettier/parser-babel"));
var _tempy = _interopRequireDefault(require("tempy"));
const formatCode = async code => {
  return (0, _prettier.format)(code, {
    parser: 'babel-ts',
    plugins: [_parserBabel.default]
  });
};
exports.formatCode = formatCode;
const createProjectMock = () => {
  const tempDir = _tempy.default.directory();
  // add fake redwood.toml
  _fs.default.closeSync(_fs.default.openSync(_path.default.join(tempDir, 'redwood.toml'), 'w'));
  return tempDir;
};
exports.createProjectMock = createProjectMock;