"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Set_exports = {};
__export(Set_exports, {
  Private: () => Private,
  PrivateSet: () => PrivateSet,
  Set: () => Set,
  isPrivateNode: () => isPrivateNode,
  isPrivateSetNode: () => isPrivateSetNode,
  isSetNode: () => isSetNode
});
module.exports = __toCommonJS(Set_exports);
var import_react = __toESM(require("react"), 1);
function Set(props) {
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, props.children);
}
function Private(props) {
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, props.children);
}
function PrivateSet(props) {
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, props.children);
}
const isSetNode = (node) => {
  return import_react.default.isValidElement(node) && (node.type === Set || node.type === PrivateSet || node.type === Private) && // Don't even bother including Sets without children. They're useless.
  node.props.children;
};
const isPrivateSetNode = (node) => {
  return import_react.default.isValidElement(node) && node.type === PrivateSet;
};
const isPrivateNode = (node) => {
  return import_react.default.isValidElement(node) && node.type === Private;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Private,
  PrivateSet,
  Set,
  isPrivateNode,
  isPrivateSetNode,
  isSetNode
});
