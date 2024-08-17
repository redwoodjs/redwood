"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
_Object$defineProperty(exports, "RwTypeScriptResolversVisitor", {
  enumerable: true,
  get: function () {
    return _visitor.RwTypeScriptResolversVisitor;
  }
});
_Object$defineProperty(exports, "TypeScriptResolversPluginConfig", {
  enumerable: true,
  get: function () {
    return _typescriptResolvers.TypeScriptResolversPluginConfig;
  }
});
exports.plugin = void 0;
var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/index-of"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _findIndex = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find-index"));
var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/slice"));
require("core-js/modules/es.array.push.js");
var _pluginHelpers = require("@graphql-codegen/plugin-helpers");
var _typescriptResolvers = require("@graphql-codegen/typescript-resolvers");
var _visitor = require("./visitor");
const plugin = (schema, _documents, config) => {
  var _context, _context2;
  // This is the key change compared to the standard typescript-resolver
  // plugin implementation - we use our own Visitor here.
  const visitor = new _visitor.RwTypeScriptResolversVisitor(config, schema);

  // runs visitor
  const visitorResult = (0, _pluginHelpers.oldVisit)((0, _pluginHelpers.getCachedDocumentNodeFromSchema)(schema), {
    leave: visitor
  });

  // `content` here is the output of the original plugin, including the
  // original visitor
  const {
    prepend,
    content
  } = (0, _typescriptResolvers.plugin)(schema, [], config);

  // A few types needed for our own RW-specific solution
  prepend.push(`export type OptArgsResolverFn<TResult, TParent = {}, TContext = {}, TArgs = {}> = (
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>

    export type RequiredResolverFn<TResult, TParent = {}, TContext = {}, TArgs = {}> = (
      args: TArgs,
      obj: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`);

  // `content` is constructed like this:
  //   content: [
  //     header,
  //     resolversTypeMapping,
  //     resolversParentTypeMapping,
  //                                          <--- `visitorResultStart` below
  //     ...visitorResult.definitions.filter(
  //       (d: unknown) => typeof d === 'string'
  //     ),
  //                                          <--- `visitorResultEnd` below
  //     getRootResolver(),
  //     getAllDirectiveResolvers(),
  //   ].join('\n'),
  // We want to replace `visitorResult` with our own result.
  // We assume that the original visitorResult begins with the same text as our
  // `visitorResult`. We use this to find where we should start replacing content
  // We then execute `getRootResolver()` to know what that looks like, and find
  // the first line of that output. This is where we'll end our replacement.
  // Then we just replace whatever is between those two things with our own
  // result

  const splitContent = content.split('\n');
  const visitorResultStart = (0, _indexOf.default)(splitContent).call(splitContent, (0, _filter.default)(_context = visitorResult.definitions).call(_context, d => typeof d === 'string')[0].split('\n')[0]);
  const splitRootResolver = visitor.getRootResolver().split('\n');
  const visitorResultEnd = (0, _findIndex.default)(splitContent).call(splitContent, (line, index) => line === splitRootResolver[0] && splitContent[index + 1] === splitRootResolver[1]);

  // Building up `content` with the original visitor content replaced by our
  // visitor content
  const newContent = [...(0, _slice.default)(splitContent).call(splitContent, 0, visitorResultStart), ...(0, _filter.default)(_context2 = visitorResult.definitions).call(_context2, d => typeof d === 'string'), ...(0, _slice.default)(splitContent).call(splitContent, visitorResultEnd)];
  return {
    prepend,
    content: newContent.join('\n')
  };
};
exports.plugin = plugin;