"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.shutdownPort = void 0;
var _killPort = _interopRequireDefault(require("kill-port"));
const shutdownPort = (port, method = 'tcp') => {
  return (0, _killPort.default)(port, method);
};
exports.shutdownPort = shutdownPort;