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
var jsxAttributeValue_exports = {};
__export(jsxAttributeValue_exports, {
  getJsxAttributeValue: () => getJsxAttributeValue
});
module.exports = __toCommonJS(jsxAttributeValue_exports);
const getJsxAttributeValue = (expression) => {
  if (expression === null) {
    return true;
  }
  if (expression.type === "StringLiteral") {
    return expression.value;
  }
  if (expression.type === "JSXExpressionContainer") {
    return getJsxAttributeValue(expression.expression);
  }
  if (expression.type === "ArrayExpression") {
    return expression.elements.map((element) => getJsxAttributeValue(element));
  }
  if (expression.type === "TemplateLiteral") {
    const expressions = expression.expressions.map((element) => ({
      ...element,
      value: {
        raw: element.value,
        cooked: getJsxAttributeValue(element)
      }
    }));
    return expressions.concat(expression.quasis).sort((elementA, elementB) => elementA.start - elementB.start).reduce(
      (string, element) => `${string}${element.value.cooked.toString()}`,
      ""
    );
  }
  if (expression.type === "ObjectExpression") {
    const entries = expression.properties.map((property) => {
      const key = getJsxAttributeValue(property.key);
      const value = getJsxAttributeValue(property.value);
      if (key === void 0 || value === void 0) {
        return null;
      }
      return { key, value };
    }).filter((property) => property).reduce((properties, property) => {
      return { ...properties, [property.key]: property.value };
    }, {});
    return entries;
  }
  if (expression.type === "Identifier") {
    return expression.name;
  }
  if (expression.type === "BinaryExpression") {
    switch (expression.operator) {
      case "+":
        return getJsxAttributeValue(expression.left) + getJsxAttributeValue(expression.right);
      case "-":
        return getJsxAttributeValue(expression.left) - getJsxAttributeValue(expression.right);
      case "*":
        return getJsxAttributeValue(expression.left) * getJsxAttributeValue(expression.right);
      case "**":
        return getJsxAttributeValue(expression.left) ** getJsxAttributeValue(expression.right);
      case "/":
        return getJsxAttributeValue(expression.left) / getJsxAttributeValue(expression.right);
      case "%":
        return getJsxAttributeValue(expression.left) % getJsxAttributeValue(expression.right);
      case "==":
        return getJsxAttributeValue(expression.left) == getJsxAttributeValue(expression.right);
      case "===":
        return getJsxAttributeValue(expression.left) === getJsxAttributeValue(expression.right);
      case "!=":
        return getJsxAttributeValue(expression.left) != getJsxAttributeValue(expression.right);
      case "!==":
        return getJsxAttributeValue(expression.left) !== getJsxAttributeValue(expression.right);
      case "<":
        return getJsxAttributeValue(expression.left) < getJsxAttributeValue(expression.right);
      case "<=":
        return getJsxAttributeValue(expression.left) <= getJsxAttributeValue(expression.right);
      case ">":
        return getJsxAttributeValue(expression.left) > getJsxAttributeValue(expression.right);
      case ">=":
        return getJsxAttributeValue(expression.left) >= getJsxAttributeValue(expression.right);
      case "<<":
        return getJsxAttributeValue(expression.left) << getJsxAttributeValue(expression.right);
      case ">>":
        return getJsxAttributeValue(expression.left) >> getJsxAttributeValue(expression.right);
      case ">>>":
        return getJsxAttributeValue(expression.left) >>> getJsxAttributeValue(expression.right);
      case "|":
        return getJsxAttributeValue(expression.left) | getJsxAttributeValue(expression.right);
      case "&":
        return getJsxAttributeValue(expression.left) & getJsxAttributeValue(expression.right);
      case "^":
        return getJsxAttributeValue(expression.left) ^ getJsxAttributeValue(expression.right);
      default:
        return `BinaryExpression with "${expression.operator}" is not supported`;
    }
  }
  if (expression.type === "UnaryExpression") {
    switch (expression.operator) {
      case "+":
        return +getJsxAttributeValue(expression.argument);
      case "-":
        return -getJsxAttributeValue(expression.argument);
      case "~":
        return ~getJsxAttributeValue(expression.argument);
      default:
        return `UnaryExpression with "${expression.operator}" is not supported`;
    }
  }
  return `${expression.type} is not supported`;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getJsxAttributeValue
});
