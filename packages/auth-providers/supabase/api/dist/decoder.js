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
  messageForSupabaseSettingsError: () => messageForSupabaseSettingsError,
  throwSupabaseSettingsError: () => throwSupabaseSettingsError
});
module.exports = __toCommonJS(decoder_exports);
var import_ssr = require("@supabase/ssr");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_api = require("@redwoodjs/api");
const ERROR_MESSAGE = `Your project's URL, Key and Secret are required to create a Supabase client!

Check your Supabase project's API settings to find these values

https://supabase.com/dashboard/project/_/settings/api`;
const messageForSupabaseSettingsError = (envar) => {
  return `Your project's ${envar} envar is not set. ${ERROR_MESSAGE.replace(/\n/g, " ")}`;
};
const throwSupabaseSettingsError = (envar) => {
  throw new Error(messageForSupabaseSettingsError(envar));
};
const createSupabaseServerClient = (authCookies) => {
  if (!process.env.SUPABASE_URL) {
    throwSupabaseSettingsError("SUPABASE_URL");
  }
  if (!process.env.SUPABASE_KEY) {
    throwSupabaseSettingsError("SUPABASE_KEY");
  }
  return (0, import_ssr.createServerClient)(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || "",
    {
      cookies: {
        get(name) {
          return authCookies?.parsedCookie?.[name];
        }
      }
    }
  );
};
const getSupabaseAccessTokenFromCookie = async (authCookies) => {
  const supabase = createSupabaseServerClient(authCookies);
  const { data, error } = await supabase.auth.getSession();
  if (!error) {
    const { session } = data;
    if (session) {
      return await session.access_token;
    }
    throw new Error("No Supabase session found");
  } else {
    console.error(error);
    throw error;
  }
};
const authDecoder = async (token, type, { event }) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throwSupabaseSettingsError("SUPABASE_JWT_SECRET");
  }
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (type !== "supabase") {
    return null;
  }
  const authCookies = (0, import_api.parseAuthorizationCookie)(event);
  if (authCookies?.type === "supabase") {
    token = await getSupabaseAccessTokenFromCookie(authCookies);
  }
  try {
    return import_jsonwebtoken.default.verify(token, secret);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDecoder,
  messageForSupabaseSettingsError,
  throwSupabaseSettingsError
});
