"use strict";

var _context2;
var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/for-each");
var _Object$keys2 = require("@babel/runtime-corejs3/core-js/object/keys");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  AUTH_PROVIDER_HEADER: true,
  getAuthProviderHeader: true,
  parseAuthorizationCookie: true,
  parseAuthorizationHeader: true,
  getAuthenticationContext: true
};
exports.parseAuthorizationHeader = exports.parseAuthorizationCookie = exports.getAuthenticationContext = exports.getAuthProviderHeader = exports.AUTH_PROVIDER_HEADER = void 0;
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/keys"));
var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/array/is-array"));
var _parseJWT = require("./parseJWT");
_forEachInstanceProperty(_context2 = _Object$keys2(_parseJWT)).call(_context2, function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _parseJWT[key]) return;
  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _parseJWT[key];
    }
  });
});
var _cookie = require("cookie");
var _event = require("../event");
// This is shared by `@redwoodjs/web` as well as used on auth middleware
const AUTH_PROVIDER_HEADER = exports.AUTH_PROVIDER_HEADER = 'auth-provider';
const getAuthProviderHeader = event => {
  var _context;
  const authProviderKey = (0, _find.default)(_context = (0, _keys.default)(event?.headers ?? {})).call(_context, key => key.toLowerCase() === AUTH_PROVIDER_HEADER);
  if (authProviderKey) {
    return (0, _event.getEventHeader)(event, authProviderKey);
  }
  return undefined;
};
exports.getAuthProviderHeader = getAuthProviderHeader;
const parseAuthorizationCookie = event => {
  const cookie = (0, _event.getEventHeader)(event, 'Cookie');

  // Unauthenticated request
  if (!cookie) {
    return null;
  }
  const parsedCookie = (0, _cookie.parse)(cookie);
  return {
    parsedCookie,
    rawCookie: cookie,
    // When not unauthenticated, this will be null/undefined
    // Remember that the cookie header could contain other (unrelated) values!
    type: parsedCookie[AUTH_PROVIDER_HEADER]
  };
};

/**
 * Split the `Authorization` header into a schema and token part.
 */
exports.parseAuthorizationCookie = parseAuthorizationCookie;
const parseAuthorizationHeader = event => {
  const parts = (0, _event.getEventHeader)(event, 'Authorization')?.split(' ');
  if (parts?.length !== 2) {
    throw new Error('The `Authorization` header is not valid.');
  }
  const [schema, token] = parts;
  if (!schema.length || !token.length) {
    throw new Error('The `Authorization` header is not valid.');
  }
  return {
    schema,
    token
  };
};

/** @MARK Note that we do not send LambdaContext when making fetch requests
 *
 * This part is incomplete, as we need to decide how we will make the breaking change to
 * 1. getCurrentUser
 * 2. authDecoders

 */
exports.parseAuthorizationHeader = parseAuthorizationHeader;
/**
 * Get the authorization information from the request headers and request context.
 * @returns [decoded, { type, schema, token }, { event, context }]
 **/
const getAuthenticationContext = async ({
  authDecoder,
  event,
  context
}) => {
  const cookieHeader = parseAuthorizationCookie(event);
  const typeFromHeader = getAuthProviderHeader(event);

  // Short-circuit - if no auth-provider or cookie header, its
  // an unauthenticated request
  if (!typeFromHeader && !cookieHeader) {
    return undefined;
  }

  // The actual session parsing is done by the auth decoder

  let token;
  let type;
  let schema;

  // If there is a cookie header and the auth type is set in the cookie, use that
  // There can be cases, such as with Supabase where its auth client sets the cookie and Bearer token
  // but the project is not using cookie auth with an auth-provider cookie set
  // So, cookie/ssr auth needs both the token and the auth-provider in cookies
  if (cookieHeader?.type) {
    token = cookieHeader.rawCookie;
    type = cookieHeader.type;
    schema = 'cookie';
    // If type is set in the header, use Bearer token auth (priority 2)
  } else if (typeFromHeader) {
    const parsedAuthHeader = parseAuthorizationHeader(event);
    token = parsedAuthHeader.token;
    type = typeFromHeader;
    schema = parsedAuthHeader.schema;
  }

  // Unauthenticated request
  if (!token || !type || !schema) {
    return undefined;
  }

  // Run through decoders until one returns a decoded payload
  let authDecoders = [];
  if ((0, _isArray.default)(authDecoder)) {
    authDecoders = authDecoder;
  } else if (authDecoder) {
    authDecoders = [authDecoder];
  }
  let decoded = null;
  let i = 0;
  while (!decoded && i < authDecoders.length) {
    decoded = await authDecoders[i](token, type, {
      // @MARK: When called from middleware, the decoder will pass Request, not Lambda event
      event,
      context
    });
    i++;
  }

  // @TODO should we rename token? It's not actually the token - its the cookie header -because
  // some auth providers will have a cookie where we don't know the key
  return [decoded, {
    type,
    schema,
    token
  }, {
    event,
    context
  }];
};
exports.getAuthenticationContext = getAuthenticationContext;