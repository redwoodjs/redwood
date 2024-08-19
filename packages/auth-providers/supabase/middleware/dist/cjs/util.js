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
var util_exports = {};
__export(util_exports, {
  clearAuthState: () => clearAuthState,
  createSupabaseServerClient: () => createSupabaseServerClient
});
module.exports = __toCommonJS(util_exports);
var import_ssr = require("@supabase/ssr");
var import_api = require("@redwoodjs/api");
var import_auth_supabase_api = require("@redwoodjs/auth-supabase-api");
const createSupabaseServerClient = (req, res) => {
  let cookieName = null;
  if (!process.env.SUPABASE_URL) {
    (0, import_auth_supabase_api.throwSupabaseSettingsError)("SUPABASE_URL");
  }
  if (!process.env.SUPABASE_KEY) {
    (0, import_auth_supabase_api.throwSupabaseSettingsError)("SUPABASE_KEY");
  }
  const supabase = (0, import_ssr.createServerClient)(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || "",
    {
      cookies: {
        get(name) {
          cookieName = name;
          return req.cookies.get(name)?.valueOf();
        },
        set(name, value, options) {
          cookieName = name;
          req.cookies.set(name, value, options);
          res.cookies.set(name, value, options);
        },
        remove(name, options) {
          cookieName = name;
          req.cookies.set(name, "", options);
          res.cookies.set(name, "", options);
        }
      }
    }
  );
  return { cookieName, supabase };
};
const clearAuthState = (req, res) => {
  req.serverAuthState.clear();
  const { cookieName } = createSupabaseServerClient(req, res);
  if (cookieName) {
    res.cookies.unset(cookieName);
  }
  res.cookies.unset(import_api.AUTH_PROVIDER_HEADER);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearAuthState,
  createSupabaseServerClient
});
