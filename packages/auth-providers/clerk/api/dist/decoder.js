"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.clerkAuthDecoder = exports.authDecoder = void 0;
var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/starts-with"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/promise"));
/**
 * @deprecated This function will be removed; it uses a rate-limited API. Use `clerkAuthDecoder` instead.
 */
const authDecoder = async (token, type) => {
  if (type !== 'clerk') {
    return null;
  }
  const {
    users,
    verifyToken
  } = await import('@clerk/clerk-sdk-node');
  try {
    const issuer = iss => (0, _startsWith.default)(iss).call(iss, 'https://clerk.') || (0, _includes.default)(iss).call(iss, '.clerk.accounts');
    const jwtPayload = await verifyToken(token, {
      issuer,
      apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
      jwtKey: process.env.CLERK_JWT_KEY,
      apiKey: process.env.CLERK_API_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    });
    if (!jwtPayload.sub) {
      return _promise.default.reject(new Error('Session invalid'));
    }
    const user = await users.getUser(jwtPayload.sub);
    return {
      ...user,
      roles: user.publicMetadata['roles'] ?? []
    };
  } catch (error) {
    console.error(error);
    return _promise.default.reject(error);
  }
};
exports.authDecoder = authDecoder;
const clerkAuthDecoder = async (token, type) => {
  if (type !== 'clerk') {
    return null;
  }
  const {
    verifyToken
  } = await import('@clerk/clerk-sdk-node');
  try {
    const issuer = iss => (0, _startsWith.default)(iss).call(iss, 'https://clerk.') || (0, _includes.default)(iss).call(iss, '.clerk.accounts');
    const jwtPayload = await verifyToken(token, {
      issuer,
      apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
      jwtKey: process.env.CLERK_JWT_KEY,
      apiKey: process.env.CLERK_API_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    });
    if (!jwtPayload.sub) {
      return _promise.default.reject(new Error('Session invalid'));
    }
    return {
      ...jwtPayload,
      id: jwtPayload.sub
    };
  } catch (error) {
    console.error(error);
    return _promise.default.reject(error);
  }
};
exports.clerkAuthDecoder = clerkAuthDecoder;