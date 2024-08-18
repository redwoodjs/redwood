"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _path = _interopRequireDefault(require("path"));
var _tasuku = _interopRequireDefault(require("tasuku"));
var _projectConfig = require("@redwoodjs/project-config");
var _isTSProject = _interopRequireDefault(require("../../../lib/isTSProject"));
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'use-armor';
const description = exports.description = '(v4.x.x->v4.x.x) Updates createGraphQLHandler config to use GraphQL Armor config as needed';
const handler = () => {
  (0, _tasuku.default)('Use Armor', async ({
    setOutput
  }) => {
    const graphqlHandlerFile = _isTSProject.default ? 'graphql.ts' : 'graphql.js';
    await (0, _runTransform.default)({
      transformPath: _path.default.join(__dirname, 'useArmor.js'),
      targetPaths: [_path.default.join((0, _projectConfig.getPaths)().api.base, 'src', 'functions', graphqlHandlerFile)]
    });
    setOutput('Updating createGraphQLHandler for useArmor config is done! Run `yarn rw lint --fix` to prettify your code');
  });
};
exports.handler = handler;