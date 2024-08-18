"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class BaseClient {
  constructor() {}

  // if your client won't automatically reconnect, implement this function
  // to do it manually

  // Gets a value from the cache

  // Sets a value in the cache. The return value will not be used.

  // types are tightened in the child classes

  // Removes a value by its key
}
exports.default = BaseClient;