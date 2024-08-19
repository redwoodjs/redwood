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
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_api = require("@redwoodjs/api");
var import_auth_supabase_api = require("@redwoodjs/auth-supabase-api");
var import_util = require("./util.js");
const initSupabaseAuthMiddleware = ({
  getCurrentUser,
  getRoles
}) => {
  const middleware = async (req, res) => {
    const type = "supabase";
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      return res;
    }
    try {
      const authProviderCookie = req.cookies.get(import_api.AUTH_PROVIDER_HEADER);
      if (!authProviderCookie || authProviderCookie !== type) {
        return res;
      }
      const decoded = await (0, import_auth_supabase_api.authDecoder)(cookieHeader, type, {
        event: req
      });
      const currentUser = await getCurrentUser(
        decoded,
        { type, token: cookieHeader, schema: "cookie" },
        { event: req }
      );
      if (req.url.includes(`/middleware/supabase/currentUser`)) {
        res.body = // Not sure how currentUser can be string.... but types say so
        typeof currentUser === "string" ? currentUser : JSON.stringify({ currentUser });
        return res;
      }
      const userMetadata = typeof currentUser === "string" ? null : currentUser?.["user_metadata"];
      req.serverAuthState.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: userMetadata || currentUser,
        cookieHeader,
        roles: getRoles ? getRoles(decoded) : []
      });
    } catch (e) {
      console.error(e, "Error in Supabase Auth Middleware");
      (0, import_util.clearAuthState)(req, res);
      return res;
    }
    return res;
  };
  return [middleware, "*"];
};
var src_default = initSupabaseAuthMiddleware;
