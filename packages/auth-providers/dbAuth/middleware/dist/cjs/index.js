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
var src_exports = {};
__export(src_exports, {
  default: () => src_default,
  initDbAuthMiddleware: () => initDbAuthMiddleware
});
module.exports = __toCommonJS(src_exports);
var import_auth_dbauth_api = __toESM(require("@redwoodjs/auth-dbauth-api"), 1);
var import_middleware = require("@redwoodjs/web/middleware");
var import_defaultGetRoles = require("./defaultGetRoles.js");
const { dbAuthSession, cookieName: cookieNameCreator } = import_auth_dbauth_api.default;
const initDbAuthMiddleware = ({
  dbAuthHandler,
  getCurrentUser,
  getRoles = import_defaultGetRoles.defaultGetRoles,
  cookieName,
  dbAuthUrl = "/middleware/dbauth"
}) => {
  const mw = async (req, res = import_middleware.MiddlewareResponse.next()) => {
    console.log("dbAuthUrl", dbAuthUrl);
    console.log("req.url", req.url);
    if (req.url.includes(dbAuthUrl)) {
      if (req.url.includes(`${dbAuthUrl}/currentUser`)) {
        const validatedSession2 = await validateSession({
          req,
          cookieName,
          getCurrentUser
        });
        if (validatedSession2) {
          return new import_middleware.MiddlewareResponse(
            JSON.stringify({ currentUser: validatedSession2.currentUser })
          );
        } else {
          return new import_middleware.MiddlewareResponse(JSON.stringify({ currentUser: null }));
        }
      } else {
        const output = await dbAuthHandler(req);
        console.log("output", output);
        const finalHeaders = new Headers();
        Object.entries(output.headers).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((mvhHeader) => finalHeaders.append(key, mvhHeader));
          } else {
            finalHeaders.append(key, value);
          }
        });
        return new import_middleware.MiddlewareResponse(output.body, {
          headers: finalHeaders,
          status: output.statusCode
        });
      }
    }
    const cookieHeader = req.headers.get("Cookie");
    if (!cookieHeader?.includes("auth-provider")) {
      return res;
    }
    const validatedSession = await validateSession({
      req,
      cookieName,
      getCurrentUser
    });
    if (validatedSession) {
      const { currentUser, decryptedSession } = validatedSession;
      req.serverAuthState.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: currentUser,
        // dbAuth doesn't have userMetadata
        cookieHeader,
        roles: getRoles(decryptedSession)
      });
    } else {
      req.serverAuthState.clear();
      res.cookies.unset(cookieNameCreator(cookieName));
      res.cookies.unset("auth-provider");
    }
    return res;
  };
  return [mw, "*"];
};
async function validateSession({
  req,
  cookieName,
  getCurrentUser
}) {
  let decryptedSession;
  try {
    decryptedSession = dbAuthSession(
      req,
      cookieNameCreator(cookieName)
    );
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.debug("Could not decrypt dbAuth session", e);
    }
    return void 0;
  }
  if (!decryptedSession) {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        "No dbAuth session cookie found. Looking for a cookie named:",
        cookieName
      );
    }
    return void 0;
  }
  const currentUser = await getCurrentUser(
    decryptedSession,
    {
      type: "dbAuth",
      schema: "cookie",
      // @MARK: We pass the entire cookie header as a token. This isn't
      // actually the token!
      // At this point the Cookie header is guaranteed, because otherwise a
      // decryptionError would have been thrown
      token: req.headers.get("Cookie")
    },
    {
      // MWRequest is a superset of Request
      event: req
    }
  );
  return { currentUser, decryptedSession };
}
var src_default = initDbAuthMiddleware;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initDbAuthMiddleware
});
