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
var transforms_exports = {};
__export(transforms_exports, {
  isFetchApiRequest: () => isFetchApiRequest,
  normalizeRequest: () => normalizeRequest,
  parseFetchEventBody: () => parseFetchEventBody,
  parseLambdaEventBody: () => parseLambdaEventBody,
  removeNulls: () => removeNulls
});
module.exports = __toCommonJS(transforms_exports);
var import_fetch = require("@whatwg-node/fetch");
const parseLambdaEventBody = (event) => {
  if (!event.body) {
    return {};
  }
  if (event.isBase64Encoded) {
    return JSON.parse(Buffer.from(event.body, "base64").toString("utf-8"));
  } else {
    return JSON.parse(event.body);
  }
};
const parseFetchEventBody = async (event) => {
  if (!event.body) {
    return {};
  }
  const body = await event.text();
  return body ? JSON.parse(body) : {};
};
const isFetchApiRequest = (event) => {
  if (event.constructor.name === "Request" || event.constructor.name === import_fetch.Request.name) {
    return true;
  }
  if (Symbol.iterator in Object(event.headers)) {
    return true;
  }
  return false;
};
function getQueryStringParams(reqUrl) {
  const url = new URL(reqUrl);
  const params = new URLSearchParams(url.search);
  const paramObject = {};
  for (const entry of params.entries()) {
    paramObject[entry[0]] = entry[1];
  }
  return paramObject;
}
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
    headers: new import_fetch.Headers(event.headers),
    method: event.httpMethod,
    query: event.queryStringParameters,
    jsonBody
  };
}
const removeNulls = (input) => {
  for (const key in input) {
    if (input[key] === null) {
      input[key] = void 0;
    } else if (typeof input[key] === "object" && !(input[key] instanceof Date)) {
      input[key] = removeNulls(input[key]);
    }
  }
  return input;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isFetchApiRequest,
  normalizeRequest,
  parseFetchEventBody,
  parseLambdaEventBody,
  removeNulls
});
