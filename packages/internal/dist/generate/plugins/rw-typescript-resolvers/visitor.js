"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.RwTypeScriptResolversVisitor = void 0;
require("core-js/modules/es.array.push.js");
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _typescriptResolvers = require("@graphql-codegen/typescript-resolvers");
var _visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");
class RwTypeScriptResolversVisitor extends _typescriptResolvers.TypeScriptResolversVisitor {
  constructor(pluginConfig, schema) {
    super(pluginConfig, schema);
  }
  FieldDefinition(node, key, parent) {
    const hasArguments = node.arguments && node.arguments.length > 0;
    const superFieldDefinition = super.FieldDefinition(node, key, parent);
    return parentName => {
      // We're reusing pretty much all of the logic in the original plugin
      // Visitor implementation by calling the `super` method here
      const fieldDef = superFieldDefinition(parentName);

      // If this field doesn't take any arguments, and it is a resolver, then
      // we switch to using the OptArgsResolver type instead, so that the user
      // isn't forced to pass in arguments that aren't going to be used anyway
      if (!hasArguments && fieldDef?.includes(': Resolver<')) {
        return fieldDef.replace(': Resolver<', ': OptArgsResolverFn<');
      }
      return fieldDef;
    };
  }

  // Original implementation is here:
  // https://github.com/dotansimha/graphql-code-generator/blob/c6c60a3078f3797af435c3852220d8898964031d/packages/plugins/other/visitor-plugin-common/src/base-resolvers-visitor.ts#L1091
  ObjectTypeDefinition(node) {
    var _context, _context2;
    // Call the original implementation to get a block of resolvers
    const originalBlock = super.ObjectTypeDefinition(node);

    // The rest of this function is pretty much a copy/paste of the original
    // function. We're duplicating every block to get RequiredResolver types
    // for use with what we call "relation resolvers" (The stuff at the bottom
    // of service files for models that have relations)
    const name = this.convertName(node, {
      suffix: this.config.resolverTypeSuffix
    });
    const typeName = node.name;
    const parentType = this.getParentTypeToUse(typeName);
    const fieldsContent = (0, _map.default)(_context = node.fields || []).call(_context, f => f(node.name));
    const isRootType = (0, _includes.default)(_context2 = [this.schema.getQueryType()?.name, this.schema.getMutationType()?.name, this.schema.getSubscriptionType()?.name]).call(_context2, typeName);
    if (!isRootType) {
      fieldsContent.push((0, _visitorPluginCommon.indent)(`${this.config.internalResolversPrefix}isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>${this.getPunctuation('type')}`));
    }

    // This is what's different compared to the implementation I copy/pasted
    // We create a new block with a different type called
    // "ModelRelationResolver" where "Model" is the name of a prisma model.
    // We also replace all Resolver types with RequiredResolverFn types where
    // all arguments are required
    //
    // 1. We start by creating a DeclarationBlock. So something on the form
    //    X = {}
    // 2. Begin by defining X. It should be an exported type.
    // 3. `name` is our resolvers, so like 'PostResolvers', 'RedwoodResolvers',
    //    'QueryResolvers' etc.
    //    Replace 'Resolvers' with 'RelationResolvers' to construct our type name.
    //    Also set the generics for the type
    // 4. Time to generate our Block, i.e. what goes inside {} in the X = {} that
    //    we started with.
    // 5. `fieldsContent` is something like
    //    [
    //      "  contact: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QuerycontactArgs, 'id'>>;",
    //      "  contacts: OptArgsResolverFn<Array<ResolversTypes['Contact']>, ParentType, ContextType>;",
    //      "  post: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QuerypostArgs, 'id'>>;",
    //      "  posts: OptArgsResolverFn<Array<ResolversTypes['Post']>, ParentType, ContextType>;",
    //      "  redwood: OptArgsResolverFn<Maybe<ResolversTypes['Redwood']>, ParentType, ContextType>;",
    //      "  user: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryuserArgs, 'id'>>;"
    //    ]
    //    Here the type name needs to be replaced by 'RequiredResolverFn'. We
    //    do that by running a regex `replace()` on the string
    // 6. Finally we join the array with '\n' and we'll have something that
    //    looks like the type below that we can return together whatever the
    //    original implementation of this function returned (this is a
    //    different example than the one above)
    //    export type PostRelationResolvers<ContextType = RedwoodGraphQLContext, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = {
    //      author?: RequiredResolverFn<ResolversTypes['User'], ParentType, ContextType>;
    //      authorId?: RequiredResolverFn<ResolversTypes['Int'], ParentType, ContextType>;
    //      body?: RequiredResolverFn<ResolversTypes['String'], ParentType, ContextType>;
    //      createdAt?: RequiredResolverFn<ResolversTypes['DateTime'], ParentType, ContextType>;
    //      id?: RequiredResolverFn<ResolversTypes['Int'], ParentType, ContextType>;
    //      title?: RequiredResolverFn<ResolversTypes['String'], ParentType, ContextType>;
    //      __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
    //    };
    const blockRelationsResolver = new _visitorPluginCommon.DeclarationBlock(this._declarationBlockConfig).export().asKind('type').withName(name.replace('Resolvers', 'RelationResolvers'), `<ContextType = ${this.config.contextType.type}, ${this.transformParentGenericType(parentType)}>`).withBlock((0, _map.default)(fieldsContent).call(fieldsContent, content => content.replace(/: (?:OptArgs)?Resolver(?:Fn)?/, '?: RequiredResolverFn')).join('\n'));
    return originalBlock + '\n' + blockRelationsResolver.string;
  }
}
exports.RwTypeScriptResolversVisitor = RwTypeScriptResolversVisitor;