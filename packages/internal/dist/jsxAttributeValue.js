"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.getJsxAttributeValue = void 0;
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/reduce"));
var _sort = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/sort"));
var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/concat"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck This function was adapted from: https://github.com/gglnx/simplified-jsx-to-json/blob/master/index.js#L13
const getJsxAttributeValue = expression => {
  // If the expression is null, this is an implicitly "true" prop, such as readOnly
  if (expression === null) {
    return true;
  }
  if (expression.type === 'StringLiteral') {
    return expression.value;
  }
  if (expression.type === 'JSXExpressionContainer') {
    return getJsxAttributeValue(expression.expression);
  }
  if (expression.type === 'ArrayExpression') {
    var _context;
    return (0, _map.default)(_context = expression.elements).call(_context, element => getJsxAttributeValue(element));
  }
  if (expression.type === 'TemplateLiteral') {
    var _context2, _context3, _context4;
    const expressions = (0, _map.default)(_context2 = expression.expressions).call(_context2, element => ({
      ...element,
      value: {
        raw: element.value,
        cooked: getJsxAttributeValue(element)
      }
    }));
    return (0, _reduce.default)(_context3 = (0, _sort.default)(_context4 = (0, _concat.default)(expressions).call(expressions, expression.quasis)).call(_context4, (elementA, elementB) => elementA.start - elementB.start)).call(_context3, (string, element) => `${string}${element.value.cooked.toString()}`, '');
  }
  if (expression.type === 'ObjectExpression') {
    var _context5, _context6, _context7;
    const entries = (0, _reduce.default)(_context5 = (0, _filter.default)(_context6 = (0, _map.default)(_context7 = expression.properties).call(_context7, property => {
      const key = getJsxAttributeValue(property.key);
      const value = getJsxAttributeValue(property.value);
      if (key === undefined || value === undefined) {
        return null;
      }
      return {
        key,
        value
      };
    })).call(_context6, property => property)).call(_context5, (properties, property) => {
      return {
        ...properties,
        [property.key]: property.value
      };
    }, {});
    return entries;
  }
  if (expression.type === 'Identifier') {
    return expression.name;
  }
  if (expression.type === 'BinaryExpression') {
    switch (expression.operator) {
      case '+':
        return getJsxAttributeValue(expression.left) + getJsxAttributeValue(expression.right);
      case '-':
        return getJsxAttributeValue(expression.left) - getJsxAttributeValue(expression.right);
      case '*':
        return getJsxAttributeValue(expression.left) * getJsxAttributeValue(expression.right);
      case '**':
        return getJsxAttributeValue(expression.left) ** getJsxAttributeValue(expression.right);
      case '/':
        return getJsxAttributeValue(expression.left) / getJsxAttributeValue(expression.right);
      case '%':
        return getJsxAttributeValue(expression.left) % getJsxAttributeValue(expression.right);
      case '==':
        return getJsxAttributeValue(expression.left) == getJsxAttributeValue(expression.right);
      case '===':
        return getJsxAttributeValue(expression.left) === getJsxAttributeValue(expression.right);
      case '!=':
        return getJsxAttributeValue(expression.left) != getJsxAttributeValue(expression.right);
      case '!==':
        return getJsxAttributeValue(expression.left) !== getJsxAttributeValue(expression.right);
      case '<':
        return getJsxAttributeValue(expression.left) < getJsxAttributeValue(expression.right);
      case '<=':
        return getJsxAttributeValue(expression.left) <= getJsxAttributeValue(expression.right);
      case '>':
        return getJsxAttributeValue(expression.left) > getJsxAttributeValue(expression.right);
      case '>=':
        return getJsxAttributeValue(expression.left) >= getJsxAttributeValue(expression.right);
      case '<<':
        return getJsxAttributeValue(expression.left) << getJsxAttributeValue(expression.right);
      case '>>':
        return getJsxAttributeValue(expression.left) >> getJsxAttributeValue(expression.right);
      case '>>>':
        return getJsxAttributeValue(expression.left) >>> getJsxAttributeValue(expression.right);
      case '|':
        return getJsxAttributeValue(expression.left) | getJsxAttributeValue(expression.right);
      case '&':
        return getJsxAttributeValue(expression.left) & getJsxAttributeValue(expression.right);
      case '^':
        return getJsxAttributeValue(expression.left) ^ getJsxAttributeValue(expression.right);
      default:
        return `BinaryExpression with "${expression.operator}" is not supported`;
    }
  }
  if (expression.type === 'UnaryExpression') {
    switch (expression.operator) {
      case '+':
        return +getJsxAttributeValue(expression.argument);
      case '-':
        return -getJsxAttributeValue(expression.argument);
      case '~':
        return ~getJsxAttributeValue(expression.argument);
      default:
        return `UnaryExpression with "${expression.operator}" is not supported`;
    }
  }

  // Unsupported type
  return `${expression.type} is not supported`;
};
exports.getJsxAttributeValue = getJsxAttributeValue;