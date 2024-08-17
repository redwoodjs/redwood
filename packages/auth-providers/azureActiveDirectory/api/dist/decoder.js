"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var decoder_exports = {};
__export(decoder_exports, {
  authDecoder: () => authDecoder
});
module.exports = __toCommonJS(decoder_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_jwks_rsa = __toESM(require("jwks-rsa"));
const authDecoder = async (token, type) => {
  if (type !== "azureActiveDirectory") {
    return null;
  }
  const {
    AZURE_ACTIVE_DIRECTORY_AUTHORITY,
    AZURE_ACTIVE_DIRECTORY_JWT_ISSUER
  } = process.env;
  if (!AZURE_ACTIVE_DIRECTORY_AUTHORITY) {
    console.error("AZURE_ACTIVE_DIRECTORY_AUTHORITY env var is not set.");
    throw new Error("AZURE_ACTIVE_DIRECTORY_AUTHORITY env var is not set.");
  }
  return new Promise((resolve, reject) => {
    const client = (0, import_jwks_rsa.default)({
      jwksUri: `${AZURE_ACTIVE_DIRECTORY_AUTHORITY}/discovery/v2.0/keys`
    });
    import_jsonwebtoken.default.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid, (error, key) => {
          try {
            callback(error, key?.getPublicKey());
          } catch (err) {
            console.error(
              "An error occurred while trying to obtain signing key from Azure Active Directory. This might be a result of an outage. See https://status.azure.com/en-us/status for current status.",
              err
            );
          }
        });
      },
      {
        //Set via .env variable (Azure AD B2C use case) or assumes using normal AZURE AD issuer
        issuer: AZURE_ACTIVE_DIRECTORY_JWT_ISSUER ? AZURE_ACTIVE_DIRECTORY_JWT_ISSUER : `${AZURE_ACTIVE_DIRECTORY_AUTHORITY}/v2.0`,
        algorithms: ["RS256"]
      },
      (verifyError, decoded) => {
        if (verifyError) {
          return reject(verifyError);
        }
        resolve(
          typeof decoded === "undefined" ? null : decoded
        );
      }
    );
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDecoder
});
