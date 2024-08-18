"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.getEventHeader = void 0;
var _transforms = require("./transforms");
// Extracts the header from an event, handling lower and upper case header names.
const getEventHeader = (event, headerName) => {
  if ((0, _transforms.isFetchApiRequest)(event)) {
    return event.headers.get(headerName);
  }
  return event.headers[headerName] || event.headers[headerName.toLowerCase()];
};
exports.getEventHeader = getEventHeader;