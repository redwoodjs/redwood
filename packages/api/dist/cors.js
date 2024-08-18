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
var cors_exports = {};
__export(cors_exports, {
  createCorsContext: () => createCorsContext
});
module.exports = __toCommonJS(cors_exports);
var import_fetch = require("@whatwg-node/fetch");
function createCorsContext(cors) {
  const corsHeaders = new import_fetch.Headers();
  if (cors) {
    if (cors.methods) {
      if (typeof cors.methods === "string") {
        corsHeaders.set("access-control-allow-methods", cors.methods);
      } else if (Array.isArray(cors.methods)) {
        corsHeaders.set("access-control-allow-methods", cors.methods.join(","));
      }
    }
    if (cors.allowedHeaders) {
      if (typeof cors.allowedHeaders === "string") {
        corsHeaders.set("access-control-allow-headers", cors.allowedHeaders);
      } else if (Array.isArray(cors.allowedHeaders)) {
        corsHeaders.set(
          "access-control-allow-headers",
          cors.allowedHeaders.join(",")
        );
      }
    }
    if (cors.exposedHeaders) {
      if (typeof cors.exposedHeaders === "string") {
        corsHeaders.set("access-control-expose-headers", cors.exposedHeaders);
      } else if (Array.isArray(cors.exposedHeaders)) {
        corsHeaders.set(
          "access-control-expose-headers",
          cors.exposedHeaders.join(",")
        );
      }
    }
    if (cors.credentials) {
      corsHeaders.set("access-control-allow-credentials", "true");
    }
    if (typeof cors.maxAge === "number") {
      corsHeaders.set("access-control-max-age", cors.maxAge.toString());
    }
  }
  return {
    shouldHandleCors(request) {
      return request.method === "OPTIONS";
    },
    getRequestHeaders(request) {
      const eventHeaders = new import_fetch.Headers(request.headers);
      const requestCorsHeaders = new import_fetch.Headers(corsHeaders);
      if (cors?.origin) {
        const requestOrigin = eventHeaders.get("origin");
        if (typeof cors.origin === "string") {
          requestCorsHeaders.set("access-control-allow-origin", cors.origin);
        } else if (requestOrigin && (typeof cors.origin === "boolean" || Array.isArray(cors.origin) && requestOrigin && cors.origin.includes(requestOrigin))) {
          requestCorsHeaders.set("access-control-allow-origin", requestOrigin);
        }
        const requestAccessControlRequestHeaders = eventHeaders.get(
          "access-control-request-headers"
        );
        if (!cors.allowedHeaders && requestAccessControlRequestHeaders) {
          requestCorsHeaders.set(
            "access-control-allow-headers",
            requestAccessControlRequestHeaders
          );
        }
      }
      return Object.fromEntries(requestCorsHeaders.entries());
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCorsContext
});
