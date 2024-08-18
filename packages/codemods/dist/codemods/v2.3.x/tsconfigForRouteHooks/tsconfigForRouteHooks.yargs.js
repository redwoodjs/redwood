"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _tasuku = _interopRequireDefault(require("tasuku"));
var _tsconfigForRouteHooks = _interopRequireDefault(require("./tsconfigForRouteHooks"));
const command = exports.command = 'tsconfig-for-route-hooks';
const description = exports.description = '(v2.3.x->v2.3.x) Allow $api imports in *.routesHooks.ts files';
const handler = () => {
  // @ts-expect-error ignore, old codemod
  (0, _tasuku.default)('Tsconfig For Route Hooks', async ({
    setOutput
  }) => {
    (0, _tsconfigForRouteHooks.default)();
    setOutput('All done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;