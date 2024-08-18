"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.updateNodeEngineTo18 = updateNodeEngineTo18;
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
require("core-js/modules/esnext.json.parse.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _projectConfig = require("@redwoodjs/project-config");
async function updateNodeEngineTo18() {
  const packageJSONPath = _path.default.join((0, _projectConfig.getPaths)().base, 'package.json');
  const packageJSON = JSON.parse(_fs.default.readFileSync(packageJSONPath, 'utf-8'));
  packageJSON.engines.node = '=18.x';
  _fs.default.writeFileSync(packageJSONPath, (0, _stringify.default)(packageJSON, null, 2));
}