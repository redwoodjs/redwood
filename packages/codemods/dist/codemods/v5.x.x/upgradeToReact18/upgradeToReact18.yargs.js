"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _tasuku = _interopRequireDefault(require("tasuku"));
var _upgradeToReact = require("./upgradeToReact18");
const command = exports.command = 'upgrade-to-react-18';
const description = exports.description = '(v4.x.x->v5.0.0) Upgrades a project to React 18 and checks the react root';
const handler = () => {
  (0, _tasuku.default)('Check and transform react root', async taskContext => {
    (0, _upgradeToReact.checkAndTransformReactRoot)(taskContext);
  });
  (0, _tasuku.default)('Check and update custom web index', async taskContext => {
    await (0, _upgradeToReact.checkAndUpdateCustomWebIndex)(taskContext);
  });
  (0, _tasuku.default)('Update react deps', async () => {
    await (0, _upgradeToReact.upgradeReactDepsTo18)();
  });
};
exports.handler = handler;