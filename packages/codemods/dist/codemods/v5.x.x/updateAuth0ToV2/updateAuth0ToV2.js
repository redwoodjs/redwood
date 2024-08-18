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
var updateAuth0ToV2_exports = {};
__export(updateAuth0ToV2_exports, {
  default: () => transform
});
module.exports = __toCommonJS(updateAuth0ToV2_exports);
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  const paths = ast.find(j.ObjectProperty, (node) => {
    return ["redirect_uri", "audience"].includes(node.key.name);
  });
  let nodes = paths.nodes();
  nodes = nodes.map((node) => {
    const { comments: _comments, ...rest } = node;
    return rest;
  });
  paths.remove();
  ast.find(j.ObjectProperty, { key: { name: "client_id" } }).insertAfter(
    j.objectProperty(
      j.identifier("authorizationParams"),
      j.objectExpression(nodes)
    )
  );
  ast.find(j.Identifier, { name: "client_id" }).replaceWith("clientId");
  return ast.toSource({
    trailingComma: true,
    quote: "single",
    lineTerminator: "\n"
  });
}
