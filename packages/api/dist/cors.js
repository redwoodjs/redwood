"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.createCorsContext = createCorsContext;
var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/array/is-array"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _fromEntries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/from-entries"));
var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/entries"));
var _fetch = require("@whatwg-node/fetch");
function createCorsContext(cors) {
  // Taken from apollo-server-env
  // @see: https://github.com/apollographql/apollo-server/blob/9267a79b974e397e87ad9ee408b65c46751e4565/packages/apollo-server-env/src/polyfills/fetch.js#L1
  const corsHeaders = new _fetch.Headers();
  if (cors) {
    if (cors.methods) {
      if (typeof cors.methods === 'string') {
        corsHeaders.set('access-control-allow-methods', cors.methods);
      } else if ((0, _isArray.default)(cors.methods)) {
        corsHeaders.set('access-control-allow-methods', cors.methods.join(','));
      }
    }
    if (cors.allowedHeaders) {
      if (typeof cors.allowedHeaders === 'string') {
        corsHeaders.set('access-control-allow-headers', cors.allowedHeaders);
      } else if ((0, _isArray.default)(cors.allowedHeaders)) {
        corsHeaders.set('access-control-allow-headers', cors.allowedHeaders.join(','));
      }
    }
    if (cors.exposedHeaders) {
      if (typeof cors.exposedHeaders === 'string') {
        corsHeaders.set('access-control-expose-headers', cors.exposedHeaders);
      } else if ((0, _isArray.default)(cors.exposedHeaders)) {
        corsHeaders.set('access-control-expose-headers', cors.exposedHeaders.join(','));
      }
    }
    if (cors.credentials) {
      corsHeaders.set('access-control-allow-credentials', 'true');
    }
    if (typeof cors.maxAge === 'number') {
      corsHeaders.set('access-control-max-age', cors.maxAge.toString());
    }
  }
  return {
    shouldHandleCors(request) {
      return request.method === 'OPTIONS';
    },
    getRequestHeaders(request) {
      const eventHeaders = new _fetch.Headers(request.headers);
      const requestCorsHeaders = new _fetch.Headers(corsHeaders);
      if (cors?.origin) {
        var _context;
        const requestOrigin = eventHeaders.get('origin');
        if (typeof cors.origin === 'string') {
          requestCorsHeaders.set('access-control-allow-origin', cors.origin);
        } else if (requestOrigin && (typeof cors.origin === 'boolean' || (0, _isArray.default)(cors.origin) && requestOrigin && (0, _includes.default)(_context = cors.origin).call(_context, requestOrigin))) {
          requestCorsHeaders.set('access-control-allow-origin', requestOrigin);
        }
        const requestAccessControlRequestHeaders = eventHeaders.get('access-control-request-headers');
        if (!cors.allowedHeaders && requestAccessControlRequestHeaders) {
          requestCorsHeaders.set('access-control-allow-headers', requestAccessControlRequestHeaders);
        }
      }
      return (0, _fromEntries.default)((0, _entries.default)(requestCorsHeaders).call(requestCorsHeaders));
    }
  };
}