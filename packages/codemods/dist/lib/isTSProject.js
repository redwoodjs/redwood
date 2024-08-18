"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _projectConfig = require("@redwoodjs/project-config");
const isTSProject = _fastGlob.default.sync(`${(0, _projectConfig.getPaths)().base}/**/tsconfig.json`, {
  ignore: ['**/node_modules/**']
}).length > 0;
var _default = exports.default = isTSProject;