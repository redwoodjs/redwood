"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.updateGraphqlConfig = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _fetch = require("@whatwg-node/fetch");
var _projectConfig = require("@redwoodjs/project-config");
const updateGraphqlConfig = async () => {
  const res = await (0, _fetch.fetch)(
  // TODO: Have to come back here to update the URL when we have a more
  // stable location than main
  // 'https://raw.githubusercontent.com/redwoodjs/redwood/release/major/v7.0.0/packages/create-redwood-app/templates/ts/graphql.config.js'
  'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/templates/ts/graphql.config.js');
  const text = await res.text();
  _fs.default.writeFileSync(_path.default.join((0, _projectConfig.getPaths)().base, 'graphql.config.js'), text);
};
exports.updateGraphqlConfig = updateGraphqlConfig;