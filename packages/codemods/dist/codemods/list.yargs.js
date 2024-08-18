"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = exports.builder = exports.aliases = void 0;
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _yargsParser = require("yargs-parser");
const command = exports.command = 'list <rwVersion>';
const description = exports.description = 'List available codemods for a specific version';
const aliases = exports.aliases = ['ls'];
const builder = yargs => {
  var _context;
  yargs.positional('rwVersion', {
    type: 'string',
    required: true,
    choices: (0, _filter.default)(_context = _fs.default.readdirSync(__dirname)).call(_context, file => !_fs.default.statSync(_path.default.join(__dirname, file)).isFile()) // Only list the folders
  });
};
exports.builder = builder;
const handler = ({
  rwVersion
}) => {
  console.log('Listing codemods for', rwVersion);
  console.log();
  const modsForVersion = _fs.default.readdirSync(_path.default.join(__dirname, rwVersion));
  (0, _forEach.default)(modsForVersion).call(modsForVersion, codemod => {
    // Use decamelize to match the usual yargs names,
    // instead of having to load the .yargs files
    console.log(`- npx @redwoodjs/codemods ${(0, _yargsParser.decamelize)(codemod)}`);
  });
};
exports.handler = handler;