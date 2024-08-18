"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _path = _interopRequireDefault(require("path"));
var _tasuku = _interopRequireDefault(require("tasuku"));
var _cells = require("../../../lib/cells");
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'cell-query-result';
const description = exports.description = '(v4.x.x->v5.x.x) Updates cells to use the `queryResult` property';
const handler = () => {
  (0, _tasuku.default)('cellQueryResult', async ({
    setOutput
  }) => {
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'cellQueryResult.js'),
      targetPaths: (0, _cells.findCells)()
    });
    setOutput('Updates to your cells are complete! Please run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;