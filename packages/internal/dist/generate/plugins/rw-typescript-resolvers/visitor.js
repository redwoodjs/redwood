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
var visitor_exports = {};
__export(visitor_exports, {
  RwTypeScriptResolversVisitor: () => RwTypeScriptResolversVisitor
});
module.exports = __toCommonJS(visitor_exports);
var import_typescript_resolvers = require("@graphql-codegen/typescript-resolvers");
var import_visitor_plugin_common = require("@graphql-codegen/visitor-plugin-common");
class RwTypeScriptResolversVisitor extends import_typescript_resolvers.TypeScriptResolversVisitor {
  constructor(pluginConfig, schema) {
    super(pluginConfig, schema);
  }
  FieldDefinition(node, key, parent) {
    const hasArguments = node.arguments && node.arguments.length > 0;
    const superFieldDefinition = super.FieldDefinition(node, key, parent);
    return (parentName) => {
      const fieldDef = superFieldDefinition(parentName);
      if (!hasArguments && fieldDef?.includes(": Resolver<")) {
        return fieldDef.replace(": Resolver<", ": OptArgsResolverFn<");
      }
      return fieldDef;
    };
  }
  // Original implementation is here:
  // https://github.com/dotansimha/graphql-code-generator/blob/c6c60a3078f3797af435c3852220d8898964031d/packages/plugins/other/visitor-plugin-common/src/base-resolvers-visitor.ts#L1091
  ObjectTypeDefinition(node) {
    const originalBlock = super.ObjectTypeDefinition(node);
    const name = this.convertName(node, {
      suffix: this.config.resolverTypeSuffix
    });
    const typeName = node.name;
    const parentType = this.getParentTypeToUse(typeName);
    const fieldsContent = (node.fields || []).map((f) => f(node.name));
    const isRootType = [
      this.schema.getQueryType()?.name,
      this.schema.getMutationType()?.name,
      this.schema.getSubscriptionType()?.name
    ].includes(typeName);
    if (!isRootType) {
      fieldsContent.push(
        (0, import_visitor_plugin_common.indent)(
          `${this.config.internalResolversPrefix}isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>${this.getPunctuation(
            "type"
          )}`
        )
      );
    }
    const blockRelationsResolver = new import_visitor_plugin_common.DeclarationBlock(
      this._declarationBlockConfig
    ).export().asKind("type").withName(
      name.replace("Resolvers", "RelationResolvers"),
      `<ContextType = ${this.config.contextType.type}, ${this.transformParentGenericType(parentType)}>`
    ).withBlock(
      fieldsContent.map(
        (content) => content.replace(
          /: (?:OptArgs)?Resolver(?:Fn)?/,
          "?: RequiredResolverFn"
        )
      ).join("\n")
    );
    return originalBlock + "\n" + blockRelationsResolver.string;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RwTypeScriptResolversVisitor
});
