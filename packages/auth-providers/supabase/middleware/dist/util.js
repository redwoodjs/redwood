import { createServerClient } from "@supabase/ssr";
import { AUTH_PROVIDER_HEADER } from "@redwoodjs/api";
import { throwSupabaseSettingsError } from "@redwoodjs/auth-supabase-api";
const createSupabaseServerClient = (req, res) => {
  let cookieName = null;
  if (!process.env.SUPABASE_URL) {
    throwSupabaseSettingsError("SUPABASE_URL");
  }
  if (!process.env.SUPABASE_KEY) {
    throwSupabaseSettingsError("SUPABASE_KEY");
  }
  const supabase = createServerClient(
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
  res.cookies.unset(AUTH_PROVIDER_HEADER);
};
export {
  clearAuthState,
  createSupabaseServerClient
};
