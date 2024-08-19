import { AUTH_PROVIDER_HEADER } from "@redwoodjs/api";
import { authDecoder } from "@redwoodjs/auth-supabase-api";
import { clearAuthState } from "./util.js";
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
      const authProviderCookie = req.cookies.get(AUTH_PROVIDER_HEADER);
      if (!authProviderCookie || authProviderCookie !== type) {
        return res;
      }
      const decoded = await authDecoder(cookieHeader, type, {
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
      clearAuthState(req, res);
      return res;
    }
    return res;
  };
  return [middleware, "*"];
};
var src_default = initSupabaseAuthMiddleware;
export {
  src_default as default
};
