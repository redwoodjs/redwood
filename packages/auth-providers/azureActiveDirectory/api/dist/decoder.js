"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.authDecoder = void 0;
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/promise"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _jwksRsa = _interopRequireDefault(require("jwks-rsa"));
const authDecoder = async (token, type) => {
  if (type !== 'azureActiveDirectory') {
    return null;
  }
  const {
    AZURE_ACTIVE_DIRECTORY_AUTHORITY,
    AZURE_ACTIVE_DIRECTORY_JWT_ISSUER
  } = process.env;

  // Make sure we have required environment variables
  if (!AZURE_ACTIVE_DIRECTORY_AUTHORITY) {
    console.error('AZURE_ACTIVE_DIRECTORY_AUTHORITY env var is not set.');
    throw new Error('AZURE_ACTIVE_DIRECTORY_AUTHORITY env var is not set.');
  }
  return new _promise.default((resolve, reject) => {
    // Microsoft identity platform and OpenID Connect protocol
    // https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc
    //
    // OpenID Provider Metadata
    // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata

    const client = (0, _jwksRsa.default)({
      jwksUri: `${AZURE_ACTIVE_DIRECTORY_AUTHORITY}/discovery/v2.0/keys`
    });

    // Verify jwt token
    _jsonwebtoken.default.verify(token, (header, callback) => {
      client.getSigningKey(header.kid, (error, key) => {
        try {
          callback(error, key?.getPublicKey());
        } catch (err) {
          console.error('An error occurred while trying to obtain signing key from ' + 'Azure Active Directory. This might be a result of an ' + 'outage. See https://status.azure.com/en-us/status for ' + 'current status.', err);
        }
      });
    }, {
      //Set via .env variable (Azure AD B2C use case) or assumes using normal AZURE AD issuer
      issuer: AZURE_ACTIVE_DIRECTORY_JWT_ISSUER ? AZURE_ACTIVE_DIRECTORY_JWT_ISSUER : `${AZURE_ACTIVE_DIRECTORY_AUTHORITY}/v2.0`,
      algorithms: ['RS256']
    }, (verifyError, decoded) => {
      if (verifyError) {
        return reject(verifyError);
      }
      resolve(typeof decoded === 'undefined' ? null : decoded);
    });
  });
};
exports.authDecoder = authDecoder;