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
var apiGatewayProxyEvent_fixture_exports = {};
__export(apiGatewayProxyEvent_fixture_exports, {
  default: () => apiGatewayProxyEvent_fixture_default,
  mockedAPIGatewayProxyEvent: () => mockedAPIGatewayProxyEvent
});
module.exports = __toCommonJS(apiGatewayProxyEvent_fixture_exports);
const mockedAPIGatewayProxyEvent = {
  body: "MOCKED_BODY",
  headers: {},
  multiValueHeaders: {},
  httpMethod: "POST",
  isBase64Encoded: false,
  path: "/MOCK_PATH",
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "MOCKED_ACCOUNT",
    apiId: "MOCKED_API_ID",
    authorizer: { name: "MOCKED_AUTHORIZER" },
    protocol: "HTTP",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "123.123.123.123",
      user: null,
      userAgent: null,
      userArn: null
    },
    httpMethod: "POST",
    path: "/MOCK_PATH",
    stage: "MOCK_STAGE",
    requestId: "MOCKED_REQUEST_ID",
    requestTimeEpoch: 1,
    resourceId: "MOCKED_RESOURCE_ID",
    resourcePath: "MOCKED_RESOURCE_PATH"
  },
  resource: "MOCKED_RESOURCE"
};
var apiGatewayProxyEvent_fixture_default = mockedAPIGatewayProxyEvent;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mockedAPIGatewayProxyEvent
});
