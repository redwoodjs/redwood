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
var import_firebase_admin = __toESM(require("firebase-admin"));
const authDecoder = async (token, type) => {
  if (type !== "firebase") {
    return null;
  }
  try {
    return import_firebase_admin.default.auth().verifyIdToken(token);
  } catch (error) {
    const firebaseError = error;
    if (firebaseError.code === "app/no-app") {
      const message = [
        "",
        "\u{1F449} Heads up",
        "",
        "The firebase app that the auth decoder is using wasn't initialized, which usually means that you have two different versions of firebase-admin.",
        "Make sure that you only have one version of firebase-admin: `yarn why firebase-admin`",
        ""
      ].join("\n");
      firebaseError.message = `${firebaseError.message}
${message}`;
    }
    throw error;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDecoder
});
