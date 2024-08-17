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
var rw_typescript_resolvers_exports = {};
__export(rw_typescript_resolvers_exports, {
  RwTypeScriptResolversVisitor: () => import_visitor.RwTypeScriptResolversVisitor,
  TypeScriptResolversPluginConfig: () => import_typescript_resolvers.TypeScriptResolversPluginConfig,
  plugin: () => plugin
});
module.exports = __toCommonJS(rw_typescript_resolvers_exports);
var import_plugin_helpers = require("@graphql-codegen/plugin-helpers");
var import_typescript_resolvers = require("@graphql-codegen/typescript-resolvers");
var import_visitor = require("./visitor");
const plugin = (schema, _documents, config) => {
  const visitor = new import_visitor.RwTypeScriptResolversVisitor(config, schema);
  const visitorResult = (0, import_plugin_helpers.oldVisit)((0, import_plugin_helpers.getCachedDocumentNodeFromSchema)(schema), {
    leave: visitor
  });
  const { prepend, content } = (0, import_typescript_resolvers.plugin)(schema, [], config);
  prepend.push(`export type OptArgsResolverFn<TResult, TParent = {}, TContext = {}, TArgs = {}> = (
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>

    export type RequiredResolverFn<TResult, TParent = {}, TContext = {}, TArgs = {}> = (
      args: TArgs,
      obj: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`);
  const splitContent = content.split("\n");
  const visitorResultStart = splitContent.indexOf(
    visitorResult.definitions.filter((d) => typeof d === "string")[0].split("\n")[0]
  );
  const splitRootResolver = visitor.getRootResolver().split("\n");
  const visitorResultEnd = splitContent.findIndex(
    (line, index) => line === splitRootResolver[0] && splitContent[index + 1] === splitRootResolver[1]
  );
  const newContent = [
    ...splitContent.slice(0, visitorResultStart),
    ...visitorResult.definitions.filter((d) => typeof d === "string"),
    ...splitContent.slice(visitorResultEnd)
  ];
  return {
    prepend,
    content: newContent.join("\n")
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RwTypeScriptResolversVisitor,
  TypeScriptResolversPluginConfig,
  plugin
});
