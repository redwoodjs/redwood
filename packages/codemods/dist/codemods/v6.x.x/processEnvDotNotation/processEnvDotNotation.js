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
var processEnvDotNotation_exports = {};
__export(processEnvDotNotation_exports, {
  default: () => transform
});
module.exports = __toCommonJS(processEnvDotNotation_exports);
function transform(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  root.find(j.MemberExpression, {
    object: {
      type: "MemberExpression",
      object: { name: "process" },
      property: { name: "env" }
    }
  }).forEach((path) => {
    const envVarName = path.value.property;
    if (j.StringLiteral.check(envVarName)) {
      const dotNotation = j.memberExpression(
        j.memberExpression(j.identifier("process"), j.identifier("env")),
        j.identifier(envVarName.value)
      );
      j(path).replaceWith(dotNotation);
    }
  });
  return root.toSource();
}
