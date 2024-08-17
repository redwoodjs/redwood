"use strict";

var _context;
var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/for-each");
var _Object$keys = require("@babel/runtime-corejs3/core-js/object/keys");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
var _setup = require("./setup");
_forEachInstanceProperty(_context = _Object$keys(_setup)).call(_context, function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _setup[key]) return;
  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _setup[key];
    }
  });
});