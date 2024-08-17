"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = builder;
exports.handler = exports.description = exports.command = void 0;
var _terminalLink = _interopRequireDefault(require("terminal-link"));
const command = exports.command = 'dbAuth';
const description = exports.description = 'Set up auth for for dbAuth';
function builder(yargs) {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean'
  }).option('webauthn', {
    alias: 'w',
    default: null,
    description: 'Include WebAuthn support (TouchID/FaceID)',
    type: 'boolean'
  }).option('createUserModel', {
    alias: 'u',
    default: null,
    description: 'Create a User database model',
    type: 'boolean'
  }).option('generateAuthPages', {
    alias: 'g',
    default: null,
    description: 'Generate auth pages (login, signup, etc.)',
    type: 'boolean'
  }).epilogue(`Also see the ${(0, _terminalLink.default)('Redwood CLI Reference', 'https://redwoodjs.com/docs/cli-commands#setup-auth')}`);
}
const handler = async options => {
  const {
    handler
  } = await import('./setupHandler.js');
  return handler(options);
};
exports.handler = handler;