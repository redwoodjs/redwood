"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var redirect_exports = {};
__export(redirect_exports, {
  Redirect: () => Redirect
});
module.exports = __toCommonJS(redirect_exports);
var import_react = require("react");
var import_history = require("./history.js");
const Redirect = ({ to, options }) => {
  (0, import_react.useEffect)(() => {
    (0, import_history.navigate)(to, options);
  }, [to, options]);
  return null;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Redirect
});
