"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _tasuku = _interopRequireDefault(require("tasuku"));
var _detectEmptyCells = require("./detectEmptyCells");
const command = exports.command = 'detect-empty-cells';
const description = exports.description = '(v4.x.x->v5.x.x) Detects Cells susceptible to the new Empty behavior';
const handler = () => {
  (0, _tasuku.default)('Detecting Cells susceptible to the new Empty behavior', async taskContext => {
    try {
      await (0, _detectEmptyCells.detectEmptyCells)(taskContext);
    } catch (e) {
      taskContext.setError('Failed to detect cells susceptible to the new Empty behavior in your project \n' + e?.message);
    }
  });
};
exports.handler = handler;