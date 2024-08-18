"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _tasuku = _interopRequireDefault(require("tasuku"));
var _updateNodeEngineTo = require("./updateNodeEngineTo18");
const command = exports.command = 'update-node-engine-to-18';
const description = exports.description = '(v4.x.x->v5.x.x) Updates `engines.node` to `"=18.x"` in your project\'s root package.json';
const handler = () => {
  (0, _tasuku.default)('Updating `engines.node` to `"=18.x"` in root package.json', async ({
    setError
  }) => {
    try {
      await (0, _updateNodeEngineTo.updateNodeEngineTo18)();
    } catch (e) {
      setError('Failed to codemod your project \n' + e?.message);
    }
  });
};
exports.handler = handler;