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
var entryClientNullCheck_exports = {};
__export(entryClientNullCheck_exports, {
  default: () => transform
});
module.exports = __toCommonJS(entryClientNullCheck_exports);
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  const node = ast.find(j.VariableDeclaration, {
    declarations: [{ id: { name: "redwoodAppElement" } }]
  });
  if (node.length === 0) {
    console.warn(
      "\nCould not find 'redwoodAppElement' variable declaration. Please make the necessary changes to your 'web/src/index.js' file manually.\n"
    );
    return file.source;
  }
  node.insertAfter(
    j.ifStatement(
      j.unaryExpression("!", j.identifier("redwoodAppElement")),
      j.blockStatement([
        j.throwStatement(
          j.newExpression(j.identifier("Error"), [
            j.literal(
              "Could not find an element with ID 'redwood-app'. Please ensure it exists in your 'web/src/index.html' file."
            )
          ])
        )
      ])
    )
  );
  return ast.toSource();
}
