"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _tasuku = _interopRequireDefault(require("tasuku"));
var _updateGraphqlConfig = require("./updateGraphqlConfig");
const command = exports.command = 'update-graphql-config';
const description = exports.description = '(v6.x->v7.x) Update graphql.config.js from the create-redwood-app template';
const handler = () => {
  (0, _tasuku.default)('Update root graphql.config.js file', async () => {
    await (0, _updateGraphqlConfig.updateGraphqlConfig)();
  });
};
exports.handler = handler;