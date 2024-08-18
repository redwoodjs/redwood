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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var auth_exports = {};
__export(auth_exports, {
  AUTH_PROVIDER_HEADER: () => AUTH_PROVIDER_HEADER,
  getAuthProviderHeader: () => getAuthProviderHeader,
  getAuthenticationContext: () => getAuthenticationContext,
  parseAuthorizationCookie: () => parseAuthorizationCookie,
  parseAuthorizationHeader: () => parseAuthorizationHeader
});
module.exports = __toCommonJS(auth_exports);
__reExport(auth_exports, require("./parseJWT"), module.exports);
var import_cookie = require("cookie");
var import_event = require("../event");
const AUTH_PROVIDER_HEADER = "auth-provider";
const getAuthProviderHeader = (event) => {
  const authProviderKey = Object.keys(event?.headers ?? {}).find(
    (key) => key.toLowerCase() === AUTH_PROVIDER_HEADER
  );
  if (authProviderKey) {
    return (0, import_event.getEventHeader)(event, authProviderKey);
  }
  return void 0;
};
const parseAuthorizationCookie = (event) => {
  const cookie = (0, import_event.getEventHeader)(event, "Cookie");
  if (!cookie) {
    return null;
  }
  const parsedCookie = (0, import_cookie.parse)(cookie);
  return {
    parsedCookie,
    rawCookie: cookie,
    // When not unauthenticated, this will be null/undefined
    // Remember that the cookie header could contain other (unrelated) values!
    type: parsedCookie[AUTH_PROVIDER_HEADER]
  };
};
const parseAuthorizationHeader = (event) => {
  const parts = (0, import_event.getEventHeader)(event, "Authorization")?.split(" ");
  if (parts?.length !== 2) {
    throw new Error("The `Authorization` header is not valid.");
  }
  const [schema, token] = parts;
  if (!schema.length || !token.length) {
    throw new Error("The `Authorization` header is not valid.");
  }
  return { schema, token };
};
const getAuthenticationContext = async ({
  authDecoder,
  event,
  context
}) => {
  const cookieHeader = parseAuthorizationCookie(event);
  const typeFromHeader = getAuthProviderHeader(event);
  if (!typeFromHeader && !cookieHeader) {
    return void 0;
  }
  let token;
  let type;
  let schema;
  if (cookieHeader?.type) {
    token = cookieHeader.rawCookie;
    type = cookieHeader.type;
    schema = "cookie";
  } else if (typeFromHeader) {
    const parsedAuthHeader = parseAuthorizationHeader(event);
    token = parsedAuthHeader.token;
    type = typeFromHeader;
    schema = parsedAuthHeader.schema;
  }
  if (!token || !type || !schema) {
    return void 0;
  }
  let authDecoders = [];
  if (Array.isArray(authDecoder)) {
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
  return [decoded, { type, schema, token }, { event, context }];
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AUTH_PROVIDER_HEADER,
  getAuthProviderHeader,
  getAuthenticationContext,
  parseAuthorizationCookie,
  parseAuthorizationHeader,
  ...require("./parseJWT")
});
