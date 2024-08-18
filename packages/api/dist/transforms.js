"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.isFetchApiRequest = void 0;
exports.normalizeRequest = normalizeRequest;
exports.removeNulls = exports.parseLambdaEventBody = exports.parseFetchEventBody = void 0;
var _isIterable2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/is-iterable"));
var _url = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/url"));
var _urlSearchParams = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/url-search-params"));
var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/entries"));
require("core-js/modules/esnext.json.parse.js");
var _fetch = require("@whatwg-node/fetch");
// This is part of the request, dreived either from a LambdaEvent or FetchAPI Request
// We do this to keep the API consistent between the two
// When we support only the FetchAPI request, we should remove this

/**
 * Extracts and parses body payload from event with base64 encoding check
 */
const parseLambdaEventBody = event => {
  if (!event.body) {
    return {};
  }
  if (event.isBase64Encoded) {
    return JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'));
  } else {
    return JSON.parse(event.body);
  }
};

/**
 * Extracts and parses body payload from Fetch Request
 * with check for empty body
 *
 * NOTE: whatwg/server expects that you will decode the base64 body yourself
 * see readme here: https://github.com/ardatan/whatwg-node/tree/master/packages/server#aws-lambda
 */
exports.parseLambdaEventBody = parseLambdaEventBody;
const parseFetchEventBody = async event => {
  if (!event.body) {
    return {};
  }
  const body = await event.text();
  return body ? JSON.parse(body) : {};
};
exports.parseFetchEventBody = parseFetchEventBody;
const isFetchApiRequest = event => {
  if (event.constructor.name === 'Request' || event.constructor.name === _fetch.Request.name) {
    return true;
  }

  // Also do an extra check on type of headers
  if ((0, _isIterable2.default)(Object(event.headers))) {
    return true;
  }
  return false;
};
exports.isFetchApiRequest = isFetchApiRequest;
function getQueryStringParams(reqUrl) {
  const url = new _url.default(reqUrl);
  const params = new _urlSearchParams.default(url.search);
  const paramObject = {};
  for (const entry of (0, _entries.default)(params).call(params)) {
    paramObject[entry[0]] = entry[1]; // each 'entry' is a [key, value] tuple
  }
  return paramObject;
}

/**
 *
 * This function returns a an object that lets you access _some_ of the request properties in a consistent way
 * You can give it either a LambdaEvent or a Fetch API Request
 *
 * NOTE: It does NOT return a full Request object!
 */
async function normalizeRequest(event) {
  if (isFetchApiRequest(event)) {
    return {
      headers: event.headers,
      method: event.method,
      query: getQueryStringParams(event.url),
      jsonBody: await parseFetchEventBody(event)
    };
  }
  const jsonBody = parseLambdaEventBody(event);
  return {
    headers: new _fetch.Headers(event.headers),
    method: event.httpMethod,
    query: event.queryStringParameters,
    jsonBody
  };
}

// Internal note:  Equivalent to dnull package on npm, which seems to have import issues in latest versions

/**
 * Useful for removing nulls from an object, such as an input from a GraphQL mutation used directly in a Prisma query
 * @param input - Object to remove nulls from
 * See {@link https://www.prisma.io/docs/concepts/components/prisma-client/null-and-undefined Prisma docs: null vs undefined}
 */
const removeNulls = input => {
  for (const key in input) {
    if (input[key] === null) {
      input[key] = undefined;
    } else if (typeof input[key] === 'object' && !(input[key] instanceof Date) // dates are objects too
    ) {
      // Note arrays are also typeof object!
      input[key] = removeNulls(input[key]);
    }
  }
  return input;
};
exports.removeNulls = removeNulls;