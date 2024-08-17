"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.getJsxElements = void 0;
require("core-js/modules/es.array.push.js");
var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/concat"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _traverse = _interopRequireDefault(require("@babel/traverse"));
var _jsxAttributeValue = require("./jsxAttributeValue");
/**
 * Extract JSX elements, children and props from static code.
 */
const getJsxElements = (ast, name) => {
  let elements = [];
  (0, _traverse.default)(ast, {
    JSXIdentifier(path) {
      if (path.node.name === name && path.parentPath.type === 'JSXOpeningElement') {
        if (path?.parentPath?.parentPath?.type === 'JSXElement') {
          const element = reduceJsxElement([], path.parentPath.parentPath.node);
          elements = (0, _concat.default)(elements).call(elements, element);
        }
      }
    }
  });
  return elements;
};

/**
 * Extract attributes (props) from a JSX element.
 */
exports.getJsxElements = getJsxElements;
const getJsxAttributes = jsxElement => {
  var _context;
  return (0, _filter.default)(_context = jsxElement.openingElement.attributes).call(_context, ({
    type
  }) => type === 'JSXAttribute');
};

/**
 * Extract and format props (attributes) from a JSX element.
 */
const getJsxProps = jsxElement => {
  const attributes = getJsxAttributes(jsxElement);
  const props = {};
  for (const a of attributes) {
    if (typeof a.name.name === 'string') {
      props[a.name.name] = (0, _jsxAttributeValue.getJsxAttributeValue)(a.value);
    }
  }
  return props;
};

/**
 * Traverse a JSX element tree and place it into a simple JSON format.
 */
const reduceJsxElement = (oldNode, currentNode) => {
  let element = {
    name: '',
    props: {},
    children: [],
    location: {
      line: 1,
      column: 0
    }
  };
  if (currentNode.type === 'JSXElement') {
    const props = getJsxProps(currentNode);
    if (currentNode.openingElement.name.type === 'JSXIdentifier') {
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
  if ('children' in currentNode) {
    var _context2;
    (0, _forEach.default)(_context2 = currentNode.children).call(_context2, node => oldNode.length > 0 ? reduceJsxElement(element.children, node) : reduceJsxElement(oldNode, node));
  }
  return oldNode;
};