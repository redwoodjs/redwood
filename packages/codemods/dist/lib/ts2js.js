"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _core = require("@babel/core");
var _projectConfig = require("@redwoodjs/project-config");
var _prettify = _interopRequireDefault(require("./prettify"));
const ts2js = file => {
  const result = (0, _core.transform)(file, {
    cwd: (0, _projectConfig.getPaths)().base,
    configFile: false,
    plugins: [['@babel/plugin-transform-typescript', {
      isTSX: true,
      allExtensions: true
    }]],
    retainLines: true
  });
  if (result?.code) {
    return (0, _prettify.default)(result.code);
  }
  return null;
};
var _default = exports.default = ts2js;