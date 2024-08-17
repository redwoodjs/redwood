"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.throwSupabaseSettingsError = exports.messageForSupabaseSettingsError = exports.authDecoder = void 0;
var _ssr = require("@supabase/ssr");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _api = require("@redwoodjs/api");
const ERROR_MESSAGE = `Your project's URL, Key and Secret are required to create a Supabase client!\n\nCheck your Supabase project's API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api`;
const messageForSupabaseSettingsError = envar => {
  return `Your project's ${envar} envar is not set. ${ERROR_MESSAGE.replace(/\n/g, ' ')}`;
};
exports.messageForSupabaseSettingsError = messageForSupabaseSettingsError;
const throwSupabaseSettingsError = envar => {
  throw new Error(messageForSupabaseSettingsError(envar));
};

/**
 * Creates Supabase Server Client used to get the session cookie (only)
 * from a given collection of auth cookies
 */
exports.throwSupabaseSettingsError = throwSupabaseSettingsError;
const createSupabaseServerClient = authCookies => {
  if (!process.env.SUPABASE_URL) {
    throwSupabaseSettingsError('SUPABASE_URL');
  }
  if (!process.env.SUPABASE_KEY) {
    throwSupabaseSettingsError('SUPABASE_KEY');
  }
  return (0, _ssr.createServerClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '', {
    cookies: {
      get(name) {
        return authCookies?.parsedCookie?.[name];
      }
    }
  });
};

/**
 * Get the Supabase access token from the cookie using the Supabase SDK and session
 */
const getSupabaseAccessTokenFromCookie = async authCookies => {
  const supabase = createSupabaseServerClient(authCookies);
  const {
    data,
    error
  } = await supabase.auth.getSession();
  if (!error) {
    const {
      session
    } = data;
    if (session) {
      return await session.access_token;
    }
    throw new Error('No Supabase session found');
  } else {
    console.error(error);
    throw error;
  }
};

/**
 * Decodes a Supabase JWT with Bearer token or uses createServerClient verify an authenticated cookie header request
 */
const authDecoder = async (token, type, {
  event
}) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throwSupabaseSettingsError('SUPABASE_JWT_SECRET');
  }
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (type !== 'supabase') {
    return null;
  }
  const authCookies = (0, _api.parseAuthorizationCookie)(event);

  // If we have a Supabase auth-provider cookie, then use the SDK to get the access token
  // Otherwise, use the Bearer token provided in the Authorization header
  if (authCookies?.type === 'supabase') {
    token = await getSupabaseAccessTokenFromCookie(authCookies);
  }
  try {
    return _jsonwebtoken.default.verify(token, secret);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
exports.authDecoder = authDecoder;