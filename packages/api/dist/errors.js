"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.RedwoodError = void 0;
class RedwoodError extends Error {
  constructor(message, extensions) {
    super(message);
    this.extensions = void 0;
    this.name = 'RedwoodError';
    this.extensions = {
      ...extensions,
      code: extensions?.code || 'REDWOODJS_ERROR'
    };
  }
}
exports.RedwoodError = RedwoodError;