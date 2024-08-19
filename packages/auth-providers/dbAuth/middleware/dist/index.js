import dbAuthApi from "@redwoodjs/auth-dbauth-api";
const { dbAuthSession, cookieName: cookieNameCreator } = dbAuthApi;
import { MiddlewareResponse } from "@redwoodjs/web/middleware";
import { defaultGetRoles } from "./defaultGetRoles.js";
const initDbAuthMiddleware = ({
  dbAuthHandler,
  getCurrentUser,
  getRoles = defaultGetRoles,
  cookieName,
  dbAuthUrl = "/middleware/dbauth"
}) => {
  const mw = async (req, res = MiddlewareResponse.next()) => {
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
          return new MiddlewareResponse(
            JSON.stringify({ currentUser: validatedSession2.currentUser })
          );
        } else {
          return new MiddlewareResponse(JSON.stringify({ currentUser: null }));
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
        return new MiddlewareResponse(output.body, {
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
export {
  src_default as default,
  initDbAuthMiddleware
};
