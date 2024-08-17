"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.authDecoder = void 0;
var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));
// Alternative third-party JWT verification process described here:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const authDecoder = async (token, type) => {
  if (type !== 'firebase') {
    return null;
  }
  try {
    return _firebaseAdmin.default.auth().verifyIdToken(token);
  } catch (error) {
    const firebaseError = error;
    if (firebaseError.code === 'app/no-app') {
      const message = ['', '👉 Heads up', '', "The firebase app that the auth decoder is using wasn't initialized, which usually means that you have two different versions of firebase-admin.", 'Make sure that you only have one version of firebase-admin: `yarn why firebase-admin`', ''].join('\n');
      firebaseError.message = `${firebaseError.message}\n${message}`;
    }
    throw error;
  }
};
exports.authDecoder = authDecoder;