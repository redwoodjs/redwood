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
var jsx_exports = {};
__export(jsx_exports, {
  getJsxElements: () => getJsxElements
});
module.exports = __toCommonJS(jsx_exports);
var import_traverse = __toESM(require("@babel/traverse"));
var import_jsxAttributeValue = require("./jsxAttributeValue");
const getJsxElements = (ast, name) => {
  let elements = [];
  (0, import_traverse.default)(ast, {
    JSXIdentifier(path) {
      if (path.node.name === name && path.parentPath.type === "JSXOpeningElement") {
        if (path?.parentPath?.parentPath?.type === "JSXElement") {
          const element = reduceJsxElement([], path.parentPath.parentPath.node);
          elements = elements.concat(element);
        }
      }
    }
  });
  return elements;
};
const getJsxAttributes = (jsxElement) => {
  return jsxElement.openingElement.attributes.filter(
    ({ type }) => type === "JSXAttribute"
  );
};
const getJsxProps = (jsxElement) => {
  const attributes = getJsxAttributes(jsxElement);
  const props = {};
  for (const a of attributes) {
    if (typeof a.name.name === "string") {
      props[a.name.name] = (0, import_jsxAttributeValue.getJsxAttributeValue)(a.value);
    }
  }
  return props;
};
const reduceJsxElement = (oldNode, currentNode) => {
  let element = {
    name: "",
    props: {},
    children: [],
    location: {
      line: 1,
      column: 0
    }
  };
  if (currentNode.type === "JSXElement") {
    const props = getJsxProps(currentNode);
    if (currentNode.openingElement.name.type === "JSXIdentifier") {
      element = {
        name: currentNode.openingElement.name.name,
        props,
        children: [],
        location: {
          line: currentNode.openingElement.loc?.start.line ?? 1,
          column: currentNode.openingElement.loc?.start.column ?? 0
        }
      };
      oldNode.push(element);
    }
  }
  if ("children" in currentNode) {
    currentNode.children.forEach(
      (node) => oldNode.length > 0 ? reduceJsxElement(element.children, node) : reduceJsxElement(oldNode, node)
    );
  }
  return oldNode;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getJsxElements
});
