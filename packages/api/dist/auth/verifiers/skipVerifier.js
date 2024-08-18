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
var skipVerifier_exports = {};
__export(skipVerifier_exports, {
  default: () => skipVerifier_default
});
module.exports = __toCommonJS(skipVerifier_exports);
const skipVerifier = (_options) => {
  return {
    sign: () => {
      console.warn(`No signature is created for the skipVerifier verifier`);
      return "";
    },
    verify: () => {
      console.warn(`The skipVerifier verifier considers all signatures valid`);
      return true;
    },
    type: "skipVerifier"
  };
};
var skipVerifier_default = skipVerifier;
