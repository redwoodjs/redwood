"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.detectEmptyCells = detectEmptyCells;
require("core-js/modules/es.array.push.js");
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _cells = require("../../../lib/cells");
async function detectEmptyCells(taskContext) {
  const warnings = [];
  const cellPaths = (0, _cells.findCells)();
  const susceptibleCells = (0, _filter.default)(cellPaths).call(cellPaths, cellPath => {
    const fileContents = (0, _cells.fileToAst)(cellPath);
    const cellQuery = (0, _cells.getCellGqlQuery)(fileContents);
    if (!cellQuery) {
      return false;
    }
    let fields;
    try {
      fields = (0, _cells.parseGqlQueryToAst)(cellQuery)[0].fields;
    } catch {
      warnings.push(cellPath);
      return;
    }
    return fields.length > 1;
  });
  if (susceptibleCells.length === 0 && warnings.length === 0) {
    taskContext.setOutput("None of your project's Cells are susceptible to the new `isDataEmpty` behavior.");
    return;
  }
  const message = [];
  if (susceptibleCells.length > 0) {
    message.push(['You have Cells that are susceptible to the new `isDataEmpty` behavior:', '', (0, _map.default)(susceptibleCells).call(susceptibleCells, c => `• ${c}`).join('\n'), ''].join('\n'));
  }
  if (warnings.length > 0) {
    var _context;
    message.push([(0, _filter.default)(_context = [message.length > 0 && '→', `The following Cell(s) could not be parsed:`]).call(_context, Boolean).join(' '), '', (0, _map.default)(warnings).call(warnings, c => `• ${c}`).join('\n'), '', "You'll have to audit them manually.", ''].join('\n'));
  }
  message.push(['The new behavior is documented in detail on the forums: https://community.redwoodjs.com/t/redwood-v5-0-0-rc-is-now-available/4715.', "It's most likely what you want, but consider whether it affects you.", "If you'd like to revert to the old behavior, you can override the `isDataEmpty` function."].join('\n'));
  const taskContextMethod = warnings.length > 0 ? 'setWarning' : 'setOutput';
  taskContext[taskContextMethod](message.join('\n'));
}