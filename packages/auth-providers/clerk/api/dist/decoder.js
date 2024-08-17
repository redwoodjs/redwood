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
  authDecoder: () => authDecoder,
  clerkAuthDecoder: () => clerkAuthDecoder
});
module.exports = __toCommonJS(decoder_exports);
const authDecoder = async (token, type) => {
  if (type !== "clerk") {
    return null;
  }
  const { users, verifyToken } = await import("@clerk/clerk-sdk-node");
  try {
    const issuer = (iss) => iss.startsWith("https://clerk.") || iss.includes(".clerk.accounts");
    const jwtPayload = await verifyToken(token, {
      issuer,
      apiUrl: process.env.CLERK_API_URL || "https://api.clerk.dev",
      jwtKey: process.env.CLERK_JWT_KEY,
      apiKey: process.env.CLERK_API_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    });
    if (!jwtPayload.sub) {
      return Promise.reject(new Error("Session invalid"));
    }
    const user = await users.getUser(jwtPayload.sub);
    return {
      ...user,
      roles: user.publicMetadata["roles"] ?? []
    };
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};
const clerkAuthDecoder = async (token, type) => {
  if (type !== "clerk") {
    return null;
  }
  const { verifyToken } = await import("@clerk/clerk-sdk-node");
  try {
    const issuer = (iss) => iss.startsWith("https://clerk.") || iss.includes(".clerk.accounts");
    const jwtPayload = await verifyToken(token, {
      issuer,
      apiUrl: process.env.CLERK_API_URL || "https://api.clerk.dev",
      jwtKey: process.env.CLERK_JWT_KEY,
      apiKey: process.env.CLERK_API_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    });
    if (!jwtPayload.sub) {
      return Promise.reject(new Error("Session invalid"));
    }
    return {
      ...jwtPayload,
      id: jwtPayload.sub
    };
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDecoder,
  clerkAuthDecoder
});
