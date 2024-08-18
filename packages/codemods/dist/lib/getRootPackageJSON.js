"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/esnext.json.parse.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _projectConfig = require("@redwoodjs/project-config");
const getRootPackageJSON = () => {
  const rootPackageJSONPath = _path.default.join((0, _projectConfig.getPaths)().base, 'package.json');
  const rootPackageJSON = JSON.parse(_fs.default.readFileSync(rootPackageJSONPath, 'utf8'));
  return [rootPackageJSON, rootPackageJSONPath];
};
var _default = exports.default = getRootPackageJSON;