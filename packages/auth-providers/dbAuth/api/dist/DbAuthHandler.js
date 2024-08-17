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
var DbAuthHandler_exports = {};
__export(DbAuthHandler_exports, {
  DbAuthHandler: () => DbAuthHandler
});
module.exports = __toCommonJS(DbAuthHandler_exports);
var import_base64url = __toESM(require("base64url"));
var import_md5 = __toESM(require("md5"));
var import_uuid = require("uuid");
var import_api = require("@redwoodjs/api");
var DbAuthError = __toESM(require("./errors"));
var import_shared = require("./shared");
const DEFAULT_ALLOWED_USER_FIELDS = ["id", "email"];
class DbAuthHandler {
  event;
  _normalizedRequest;
  httpMethod;
  options;
  cookie;
  db;
  dbAccessor;
  dbCredentialAccessor;
  allowedUserFields;
  hasInvalidSession;
  session;
  sessionCsrfToken;
  corsContext;
  sessionExpiresDate;
  webAuthnExpiresDate;
  encryptedSession = null;
  createResponse;
  get normalizedRequest() {
    if (!this._normalizedRequest) {
      throw new Error(
        "dbAuthHandler has not been initialized. Either await dbAuthHandler.invoke() or call await dbAuth.init()"
      );
    }
    return this._normalizedRequest;
  }
  // class constant: list of auth methods that are supported
  static get METHODS() {
    return [
      "forgotPassword",
      "getToken",
      "login",
      "logout",
      "resetPassword",
      "signup",
      "validateResetToken",
      "webAuthnRegOptions",
      "webAuthnRegister",
      "webAuthnAuthOptions",
      "webAuthnAuthenticate"
    ];
  }
  // class constant: maps the auth functions to their required HTTP verb for access
  static get VERBS() {
    return {
      forgotPassword: "POST",
      getToken: "GET",
      login: "POST",
      logout: "POST",
      resetPassword: "POST",
      signup: "POST",
      validateResetToken: "POST",
      webAuthnRegOptions: "GET",
      webAuthnRegister: "POST",
      webAuthnAuthOptions: "GET",
      webAuthnAuthenticate: "POST"
    };
  }
  // default to epoch when we want to expire
  static get PAST_EXPIRES_DATE() {
    return (/* @__PURE__ */ new Date("1970-01-01T00:00:00.000+00:00")).toUTCString();
  }
  // generate a new token (standard UUID)
  static get CSRF_TOKEN() {
    return (0, import_uuid.v4)();
  }
  static get AVAILABLE_WEBAUTHN_TRANSPORTS() {
    return ["usb", "ble", "nfc", "internal"];
  }
  /**
   * Returns the set-cookie header to mark the cookie as expired ("deletes" the session)
   *
   * The header keys are case insensitive, but Fastify prefers these to be lowercase.
   * Therefore, we want to ensure that the headers are always lowercase and unique
   * for compliance with HTTP/2.
   *
   * @see: https://www.rfc-editor.org/rfc/rfc7540#section-8.1.2
   */
  get _deleteSessionHeader() {
    const deleteHeaders = new Headers();
    deleteHeaders.append(
      "set-cookie",
      [
        `${(0, import_shared.cookieName)(this.options.cookie?.name)}=`,
        ...this._cookieAttributes({ expires: "now" })
      ].join(";")
    );
    deleteHeaders.append(
      "set-cookie",
      [`auth-provider=`, ...this._cookieAttributes({ expires: "now" })].join(
        ";"
      )
    );
    return deleteHeaders;
  }
  constructor(event, _context, options) {
    this.options = options;
    this.event = event;
    this.httpMethod = (0, import_api.isFetchApiRequest)(event) ? event.method : event.httpMethod;
    this.cookie = (0, import_shared.extractCookie)(event) || "";
    this.createResponse = (0, import_shared.getDbAuthResponseBuilder)(event);
    this._validateOptions();
    this.db = this.options.db;
    this.dbAccessor = this.db[this.options.authModelAccessor];
    this.dbCredentialAccessor = this.options.credentialModelAccessor ? this.db[this.options.credentialModelAccessor] : null;
    this.hasInvalidSession = false;
    this.allowedUserFields = this.options.allowedUserFields || DEFAULT_ALLOWED_USER_FIELDS;
    const sessionExpiresAt = /* @__PURE__ */ new Date();
    sessionExpiresAt.setSeconds(
      sessionExpiresAt.getSeconds() + this.options.login.expires
    );
    this.sessionExpiresDate = sessionExpiresAt.toUTCString();
    const webAuthnExpiresAt = /* @__PURE__ */ new Date();
    webAuthnExpiresAt.setSeconds(
      webAuthnExpiresAt.getSeconds() + (this.options?.webAuthn?.expires || 0)
    );
    this.webAuthnExpiresDate = webAuthnExpiresAt.toUTCString();
    if (options.cors) {
      this.corsContext = (0, import_api.createCorsContext)(options.cors);
    }
    try {
      this.encryptedSession = (0, import_shared.getSession)(this.cookie, this.options.cookie?.name);
      const [session, csrfToken] = (0, import_shared.decryptSession)(this.encryptedSession);
      this.session = session;
      this.sessionCsrfToken = csrfToken;
    } catch (e) {
      if (e instanceof DbAuthError.SessionDecryptionError) {
        this.hasInvalidSession = true;
      } else {
        throw e;
      }
    }
  }
  // Initialize the request object. This is async now, because body in Fetch Request
  // is parsed async
  async init() {
    if (!this._normalizedRequest) {
      this._normalizedRequest = await (0, import_api.normalizeRequest)(
        this.event
      );
    }
  }
  // Actual function that triggers everything else to happen: `login`, `signup`,
  // etc. is called from here, after some checks to make sure the request is good
  async invoke() {
    let corsHeaders = {};
    await this.init();
    if (this.corsContext) {
      corsHeaders = this.corsContext.getRequestHeaders(this.normalizedRequest);
      if (this.corsContext.shouldHandleCors(this.normalizedRequest)) {
        return this.createResponse({ body: "", statusCode: 200 }, corsHeaders);
      }
    }
    if (this.hasInvalidSession) {
      return this.createResponse(
        this._ok(...this._logoutResponse()),
        corsHeaders
      );
    }
    try {
      const method = await this._getAuthMethod();
      if (!DbAuthHandler.METHODS.includes(method)) {
        return this.createResponse(this._notFound(), corsHeaders);
      }
      if (this.httpMethod !== DbAuthHandler.VERBS[method]) {
        return this.createResponse(this._notFound(), corsHeaders);
      }
      const [body, headers, options = { statusCode: 200 }] = await this[method]();
      return this.createResponse(this._ok(body, headers, options), corsHeaders);
    } catch (e) {
      if (e instanceof DbAuthError.WrongVerbError) {
        return this.createResponse(this._notFound(), corsHeaders);
      } else {
        return this.createResponse(
          this._badRequest(e.message || e),
          corsHeaders
        );
      }
    }
  }
  async forgotPassword() {
    const { enabled = true } = this.options.forgotPassword;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(
        this.options.forgotPassword?.errors?.flowNotEnabled || `Forgot password flow is not enabled`
      );
    }
    const { username } = this.normalizedRequest.jsonBody || {};
    if (!username || username.trim() === "") {
      throw new DbAuthError.UsernameRequiredError(
        this.options.forgotPassword?.errors?.usernameRequired || `Username is required`
      );
    }
    let user;
    try {
      user = await this.dbAccessor.findUnique({
        where: { [this.options.authFields.username]: username }
      });
    } catch {
      throw new DbAuthError.GenericError();
    }
    if (user) {
      const tokenExpires = /* @__PURE__ */ new Date();
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() + this.options.forgotPassword.expires
      );
      let token = (0, import_md5.default)((0, import_uuid.v4)());
      const buffer = Buffer.from(token);
      token = buffer.toString("base64").replace("=", "").substring(0, 16);
      const tokenHash = (0, import_shared.hashToken)(token);
      try {
        user = await this.dbAccessor.update({
          where: {
            [this.options.authFields.id]: user[this.options.authFields.id]
          },
          data: {
            [this.options.authFields.resetToken]: tokenHash,
            [this.options.authFields.resetTokenExpiresAt]: tokenExpires
          }
        });
      } catch {
        throw new DbAuthError.GenericError();
      }
      const response = await this.options.forgotPassword.handler(this._sanitizeUser(user), token);
      return [
        response ? JSON.stringify(response) : "",
        this._deleteSessionHeader
      ];
    } else {
      throw new DbAuthError.UsernameNotFoundError(
        this.options.forgotPassword?.errors?.usernameNotFound || `Username '${username} not found`
      );
    }
  }
  async getToken() {
    try {
      const user = await this._getCurrentUser();
      let headers = new Headers();
      if ((0, import_shared.isLegacySession)(this.cookie)) {
        headers = this._loginResponse(user)[1];
      }
      return [user[this.options.authFields.id], headers];
    } catch (e) {
      if (e instanceof DbAuthError.NotLoggedInError) {
        return this._logoutResponse();
      } else {
        return this._logoutResponse({ error: e.message });
      }
    }
  }
  async login() {
    const { enabled = true } = this.options.login;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(
        this.options.login?.errors?.flowNotEnabled || `Login flow is not enabled`
      );
    }
    const { username, password } = this.normalizedRequest.jsonBody || {};
    const dbUser = await this._verifyUser(username, password);
    const handlerUser = await this.options.login.handler(
      dbUser
    );
    if (handlerUser?.[this.options.authFields.id] == null) {
      throw new DbAuthError.NoUserIdError();
    }
    return this._loginResponse(handlerUser);
  }
  logout() {
    return this._logoutResponse();
  }
  async resetPassword() {
    const { enabled = true } = this.options.resetPassword;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(
        this.options.resetPassword?.errors?.flowNotEnabled || `Reset password flow is not enabled`
      );
    }
    const { password, resetToken } = this.normalizedRequest.jsonBody || {};
    if (resetToken == null || String(resetToken).trim() === "") {
      throw new DbAuthError.ResetTokenRequiredError(
        this.options.resetPassword?.errors?.resetTokenRequired
      );
    }
    if (password == null || String(password).trim() === "") {
      throw new DbAuthError.PasswordRequiredError();
    }
    ;
    this.options.signup.passwordValidation?.(password);
    let user = await this._findUserByToken(resetToken);
    const [hashedPassword] = (0, import_shared.hashPassword)(password, {
      salt: user.salt
    });
    const [legacyHashedPassword] = (0, import_shared.legacyHashPassword)(password, user.salt);
    if (!this.options.resetPassword.allowReusedPassword && user.hashedPassword === hashedPassword || user.hashedPassword === legacyHashedPassword) {
      throw new DbAuthError.ReusedPasswordError(
        this.options.resetPassword?.errors?.reusedPassword
      );
    }
    try {
      user = await this.dbAccessor.update({
        where: {
          [this.options.authFields.id]: user[this.options.authFields.id]
        },
        data: {
          [this.options.authFields.hashedPassword]: hashedPassword
        }
      });
    } catch {
      throw new DbAuthError.GenericError();
    }
    await this._clearResetToken(user);
    const response = await this.options.resetPassword.handler(this._sanitizeUser(user));
    if (response) {
      return this._loginResponse(user);
    } else {
      return this._logoutResponse({});
    }
  }
  async signup() {
    const { enabled = true } = this.options.signup;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(
        this.options.signup?.errors?.flowNotEnabled || `Signup flow is not enabled`
      );
    }
    const { password } = this.normalizedRequest.jsonBody || {};
    this.options.signup.passwordValidation?.(
      password
    );
    const userOrMessage = await this._createUser();
    if (typeof userOrMessage === "object") {
      const user = userOrMessage;
      return this._loginResponse(user, 201);
    } else {
      const message = userOrMessage;
      return [JSON.stringify({ message }), new Headers(), { statusCode: 201 }];
    }
  }
  async validateResetToken() {
    const { resetToken } = this.normalizedRequest.jsonBody || {};
    if (!resetToken || String(resetToken).trim() === "") {
      throw new DbAuthError.ResetTokenRequiredError(
        this.options.resetPassword?.errors?.resetTokenRequired
      );
    }
    const user = await this._findUserByToken(resetToken);
    return [JSON.stringify(this._sanitizeUser(user)), this._deleteSessionHeader];
  }
  // browser submits WebAuthn credentials
  async webAuthnAuthenticate() {
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const webAuthnOptions = this.options.webAuthn;
    const { rawId } = this.normalizedRequest.jsonBody || {};
    if (!rawId) {
      throw new DbAuthError.WebAuthnError("Missing Id in request");
    }
    if (!webAuthnOptions?.enabled) {
      throw new DbAuthError.WebAuthnError("WebAuthn is not enabled");
    }
    const credential = await this.dbCredentialAccessor.findFirst({
      where: { id: rawId }
    });
    if (!credential) {
      throw new DbAuthError.WebAuthnError("Credentials not found");
    }
    const user = await this.dbAccessor.findFirst({
      where: {
        [this.options.authFields.id]: credential[webAuthnOptions.credentialFields.userId]
      }
    });
    let verification;
    try {
      const opts = {
        response: this.normalizedRequest?.jsonBody,
        // by this point jsonBody has been validated
        expectedChallenge: user[this.options.authFields.challenge],
        expectedOrigin: webAuthnOptions.origin,
        expectedRPID: webAuthnOptions.domain,
        authenticator: {
          credentialID: import_base64url.default.toBuffer(
            credential[webAuthnOptions.credentialFields.id]
          ),
          credentialPublicKey: credential[webAuthnOptions.credentialFields.publicKey],
          counter: credential[webAuthnOptions.credentialFields.counter],
          transports: credential[webAuthnOptions.credentialFields.transports] ? JSON.parse(
            credential[webAuthnOptions.credentialFields.transports]
          ) : DbAuthHandler.AVAILABLE_WEBAUTHN_TRANSPORTS
        },
        requireUserVerification: true
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (e) {
      throw new DbAuthError.WebAuthnError(e.message);
    } finally {
      await this._saveChallenge(user[this.options.authFields.id], null);
    }
    const { verified, authenticationInfo } = verification;
    if (verified) {
      await this.dbCredentialAccessor.update({
        where: {
          [webAuthnOptions.credentialFields.id]: credential[webAuthnOptions.credentialFields.id]
        },
        data: {
          [webAuthnOptions.credentialFields.counter]: authenticationInfo.newCounter
        }
      });
    }
    const [, headers] = this._loginResponse(user);
    headers.append(
      "set-cookie",
      this._webAuthnCookie(rawId, this.webAuthnExpiresDate)
    );
    return [verified, headers];
  }
  // get options for a WebAuthn authentication
  async webAuthnAuthOptions() {
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
    if (!this.options.webAuthn?.enabled) {
      throw new DbAuthError.WebAuthnError("WebAuthn is not enabled");
    }
    const webAuthnOptions = this.options.webAuthn;
    const credentialId = (0, import_shared.webAuthnSession)(this.event);
    let user;
    if (credentialId) {
      user = await this.dbCredentialAccessor.findFirst({
        where: { [webAuthnOptions.credentialFields.id]: credentialId }
      }).user();
    } else {
      user = await this._getCurrentUser();
    }
    if (!user) {
      return [
        { error: "Log in with username and password to enable WebAuthn" },
        new Headers([["set-cookie", this._webAuthnCookie("", "now")]]),
        { statusCode: 400 }
      ];
    }
    const credentials = await this.dbCredentialAccessor.findMany({
      where: {
        [webAuthnOptions.credentialFields.userId]: user[this.options.authFields.id]
      }
    });
    const someOptions = {
      timeout: webAuthnOptions.timeout || 6e4,
      allowCredentials: credentials.map((cred) => ({
        id: import_base64url.default.toBuffer(cred[webAuthnOptions.credentialFields.id]),
        type: "public-key",
        transports: cred[webAuthnOptions.credentialFields.transports] ? JSON.parse(cred[webAuthnOptions.credentialFields.transports]) : DbAuthHandler.AVAILABLE_WEBAUTHN_TRANSPORTS
      })),
      userVerification: "required",
      rpID: webAuthnOptions.domain
    };
    const authOptions = generateAuthenticationOptions(someOptions);
    await this._saveChallenge(
      user[this.options.authFields.id],
      authOptions.challenge
    );
    return [authOptions];
  }
  // get options for WebAuthn registration
  async webAuthnRegOptions() {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    if (!this.options?.webAuthn?.enabled) {
      throw new DbAuthError.WebAuthnError("WebAuthn is not enabled");
    }
    const webAuthnOptions = this.options.webAuthn;
    const user = await this._getCurrentUser();
    const options = {
      rpName: webAuthnOptions.name,
      rpID: webAuthnOptions.domain,
      userID: user[this.options.authFields.id],
      userName: user[this.options.authFields.username],
      timeout: webAuthnOptions?.timeout || 6e4,
      excludeCredentials: [],
      authenticatorSelection: {
        userVerification: "required"
      },
      // Support the two most common algorithms: ES256, and RS256
      supportedAlgorithmIDs: [-7, -257]
    };
    if (webAuthnOptions.type && webAuthnOptions.type !== "any") {
      options.authenticatorSelection = Object.assign(
        options.authenticatorSelection || {},
        { authenticatorAttachment: webAuthnOptions.type }
      );
    }
    const regOptions = generateRegistrationOptions(options);
    await this._saveChallenge(
      user[this.options.authFields.id],
      regOptions.challenge
    );
    return [regOptions];
  }
  // browser submits WebAuthn credentials for the first time on a new device
  async webAuthnRegister() {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    if (!this.options.webAuthn?.enabled) {
      throw new DbAuthError.WebAuthnError("WebAuthn is not enabled");
    }
    const user = await this._getCurrentUser();
    let verification;
    try {
      const options = {
        response: this.normalizedRequest.jsonBody,
        // by this point jsonBody has been validated
        expectedChallenge: user[this.options.authFields.challenge],
        expectedOrigin: this.options.webAuthn.origin,
        expectedRPID: this.options.webAuthn.domain,
        requireUserVerification: true
      };
      verification = await verifyRegistrationResponse(options);
    } catch (e) {
      throw new DbAuthError.WebAuthnError(e.message);
    }
    const { verified, registrationInfo } = verification;
    let plainCredentialId;
    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;
      plainCredentialId = import_base64url.default.encode(Buffer.from(credentialID));
      const existingDevice = await this.dbCredentialAccessor.findFirst({
        where: {
          [this.options.webAuthn.credentialFields.id]: plainCredentialId,
          [this.options.webAuthn.credentialFields.userId]: user[this.options.authFields.id]
        }
      });
      if (!existingDevice) {
        const { transports } = this.normalizedRequest.jsonBody || {};
        await this.dbCredentialAccessor.create({
          data: {
            [this.options.webAuthn.credentialFields.id]: plainCredentialId,
            [this.options.webAuthn.credentialFields.userId]: user[this.options.authFields.id],
            [this.options.webAuthn.credentialFields.publicKey]: Buffer.from(credentialPublicKey),
            [this.options.webAuthn.credentialFields.transports]: transports ? JSON.stringify(transports) : null,
            [this.options.webAuthn.credentialFields.counter]: counter
          }
        });
      }
    } else {
      throw new DbAuthError.WebAuthnError("Registration failed");
    }
    await this._saveChallenge(user[this.options.authFields.id], null);
    const headers = new Headers([
      [
        "set-cookie",
        this._webAuthnCookie(plainCredentialId, this.webAuthnExpiresDate)
      ]
    ]);
    return [verified, headers];
  }
  // validates that we have all the ENV and options we need to login/signup
  _validateOptions() {
    if (!process.env.SESSION_SECRET) {
      throw new DbAuthError.NoSessionSecretError();
    }
    if (this.options?.login?.enabled !== false && !this.options?.login?.expires) {
      throw new DbAuthError.NoSessionExpirationError();
    }
    if (this.options?.login?.enabled !== false && !this.options?.login?.handler) {
      throw new DbAuthError.NoLoginHandlerError();
    }
    if (this.options?.signup?.enabled !== false && !this.options?.signup?.handler) {
      throw new DbAuthError.NoSignupHandlerError();
    }
    if (this.options?.forgotPassword?.enabled !== false && !this.options?.forgotPassword?.handler) {
      throw new DbAuthError.NoForgotPasswordHandlerError();
    }
    if (this.options?.resetPassword?.enabled !== false && !this.options?.resetPassword?.handler) {
      throw new DbAuthError.NoResetPasswordHandlerError();
    }
    if (this.options?.credentialModelAccessor && !this.options?.webAuthn || this.options?.webAuthn && !this.options?.credentialModelAccessor) {
      throw new DbAuthError.NoWebAuthnConfigError();
    }
    if (this.options?.webAuthn?.enabled && (!this.options?.webAuthn?.name || !this.options?.webAuthn?.domain || !this.options?.webAuthn?.origin || !this.options?.webAuthn?.credentialFields)) {
      throw new DbAuthError.MissingWebAuthnConfigError();
    }
  }
  // Save challenge string for WebAuthn
  async _saveChallenge(userId, value) {
    await this.dbAccessor.update({
      where: {
        [this.options.authFields.id]: userId
      },
      data: {
        [this.options.authFields.challenge]: value
      }
    });
  }
  // returns the string for the webAuthn set-cookie header
  _webAuthnCookie(id, expires) {
    return [
      `webAuthn=${id}`,
      ...this._cookieAttributes({
        expires,
        options: { HttpOnly: false }
      })
    ].join(";");
  }
  // removes any fields not explicitly allowed to be sent to the client before
  // sending a response over the wire
  _sanitizeUser(user) {
    const sanitized = JSON.parse(JSON.stringify(user));
    Object.keys(sanitized).forEach((key) => {
      if (!this.allowedUserFields.includes(key)) {
        delete sanitized[key];
      }
    });
    return sanitized;
  }
  // Converts LambdaEvent or FetchRequest to
  _decodeEvent() {
  }
  // returns all the cookie attributes in an array with the proper expiration date
  //
  // pass the argument `expires` set to "now" to get the attributes needed to expire
  // the session, or "future" (or left out completely) to set to `futureExpiresDate`
  _cookieAttributes({
    expires = "now",
    options = {}
  }) {
    const userCookieAttributes = this.options.cookie?.attributes ? { ...this.options.cookie?.attributes } : { ...this.options.cookie };
    if (!this.options.cookie?.attributes) {
      delete userCookieAttributes.name;
    }
    const cookieOptions = { ...userCookieAttributes, ...options };
    const meta = Object.keys(cookieOptions).map((key) => {
      const optionValue = cookieOptions[key];
      if (optionValue === true) {
        return key;
      } else if (optionValue === false) {
        return null;
      } else {
        return `${key}=${optionValue}`;
      }
    }).filter((v) => v);
    const expiresAt = expires === "now" ? DbAuthHandler.PAST_EXPIRES_DATE : expires;
    meta.push(`Expires=${expiresAt}`);
    return meta;
  }
  _createAuthProviderCookieString() {
    return [
      `auth-provider=dbAuth`,
      ...this._cookieAttributes({ expires: this.sessionExpiresDate })
    ].join(";");
  }
  // returns the set-cookie header to be returned in the request (effectively
  // creates the session)
  _createSessionCookieString(data, csrfToken) {
    const session = JSON.stringify(data) + ";" + csrfToken;
    const encrypted = (0, import_shared.encryptSession)(session);
    const sessionCookieString = [
      `${(0, import_shared.cookieName)(this.options.cookie?.name)}=${encrypted}`,
      ...this._cookieAttributes({ expires: this.sessionExpiresDate })
    ].join(";");
    return sessionCookieString;
  }
  // checks the CSRF token in the header against the CSRF token in the session
  // and throw an error if they are not the same (not used yet)
  async _validateCsrf() {
    if (this.sessionCsrfToken !== this.normalizedRequest.headers.get("csrf-token")) {
      throw new DbAuthError.CsrfTokenMismatchError();
    }
    return true;
  }
  async _findUserByToken(token) {
    const tokenExpires = /* @__PURE__ */ new Date();
    tokenExpires.setSeconds(
      tokenExpires.getSeconds() - this.options.forgotPassword.expires
    );
    const tokenHash = (0, import_shared.hashToken)(token);
    const user = await this.dbAccessor.findFirst({
      where: {
        [this.options.authFields.resetToken]: tokenHash
      }
    });
    if (!user) {
      throw new DbAuthError.ResetTokenInvalidError(
        this.options.resetPassword?.errors?.resetTokenInvalid
      );
    }
    if (user[this.options.authFields.resetTokenExpiresAt] < tokenExpires) {
      await this._clearResetToken(user);
      throw new DbAuthError.ResetTokenExpiredError(
        this.options.resetPassword?.errors?.resetTokenExpired
      );
    }
    return user;
  }
  // removes the resetToken from the database
  async _clearResetToken(user) {
    try {
      await this.dbAccessor.update({
        where: {
          [this.options.authFields.id]: user[this.options.authFields.id]
        },
        data: {
          [this.options.authFields.resetToken]: null,
          [this.options.authFields.resetTokenExpiresAt]: null
        }
      });
    } catch {
      throw new DbAuthError.GenericError();
    }
  }
  // verifies that a username and password are correct, and returns the user if so
  async _verifyUser(username, password) {
    if (!username || username.toString().trim() === "" || !password || password.toString().trim() === "") {
      throw new DbAuthError.UsernameAndPasswordRequiredError(
        this.options.login?.errors?.usernameOrPasswordMissing
      );
    }
    const usernameMatchFlowOption = this.options.login?.usernameMatch;
    const findUniqueUserMatchCriteriaOptions = this._getUserMatchCriteriaOptions(username, usernameMatchFlowOption);
    let user;
    try {
      user = await this.dbAccessor.findFirst({
        where: findUniqueUserMatchCriteriaOptions
      });
    } catch {
      throw new DbAuthError.GenericError();
    }
    if (!user) {
      throw new DbAuthError.UserNotFoundError(
        username,
        this.options.login?.errors?.usernameNotFound
      );
    }
    await this._verifyPassword(user, password);
    return user;
  }
  // extracts scrypt strength options from hashed password (if present) and
  // compares the hashed plain text password just submitted using those options
  // with the one in the database. Falls back to the legacy CryptoJS algorihtm
  // if no options are present.
  async _verifyPassword(user, password) {
    const options = (0, import_shared.extractHashingOptions)(
      user[this.options.authFields.hashedPassword]
    );
    if (Object.keys(options).length) {
      const [hashedPassword] = (0, import_shared.hashPassword)(password, {
        salt: user[this.options.authFields.salt],
        options
      });
      if (hashedPassword === user[this.options.authFields.hashedPassword]) {
        return user;
      }
    } else {
      const [legacyHashedPassword] = (0, import_shared.legacyHashPassword)(
        password,
        user[this.options.authFields.salt]
      );
      if (legacyHashedPassword === user[this.options.authFields.hashedPassword]) {
        const [newHashedPassword] = (0, import_shared.hashPassword)(password, {
          salt: user[this.options.authFields.salt]
        });
        await this.dbAccessor.update({
          where: { id: user.id },
          data: { [this.options.authFields.hashedPassword]: newHashedPassword }
        });
        return user;
      }
    }
    throw new DbAuthError.IncorrectPasswordError(
      user[this.options.authFields.username],
      this.options.login?.errors?.incorrectPassword
    );
  }
  // gets the user from the database and returns only its ID
  async _getCurrentUser() {
    if (!this.session?.[this.options.authFields.id]) {
      throw new DbAuthError.NotLoggedInError();
    }
    const select = {
      [this.options.authFields.id]: true,
      [this.options.authFields.username]: true
    };
    if (this.options.webAuthn?.enabled && this.options.authFields.challenge) {
      select[this.options.authFields.challenge] = true;
    }
    let user;
    try {
      user = await this.dbAccessor.findUnique({
        where: {
          [this.options.authFields.id]: this.session?.[this.options.authFields.id]
        },
        select
      });
    } catch (e) {
      throw new DbAuthError.GenericError(e.message);
    }
    if (!user) {
      throw new DbAuthError.UserNotFoundError();
    }
    return user;
  }
  // creates and returns a user, first checking that the username/password
  // values pass validation
  async _createUser() {
    const { username, password, ...userAttributes } = this.normalizedRequest.jsonBody || {};
    if (this._validateField("username", username) && this._validateField("password", password)) {
      const usernameMatchFlowOption = this.options.signup?.usernameMatch;
      const findUniqueUserMatchCriteriaOptions = this._getUserMatchCriteriaOptions(username, usernameMatchFlowOption);
      const user = await this.dbAccessor.findFirst({
        where: findUniqueUserMatchCriteriaOptions
      });
      if (user) {
        throw new DbAuthError.DuplicateUsernameError(
          username,
          this.options.signup?.errors?.usernameTaken
        );
      }
      const [hashedPassword, salt] = (0, import_shared.hashPassword)(password);
      const newUser = await this.options.signup.handler({
        username,
        hashedPassword,
        salt,
        userAttributes
      });
      return newUser;
    }
  }
  // figure out which auth method we're trying to call
  async _getAuthMethod() {
    let methodName = this.normalizedRequest.query?.method;
    if (!DbAuthHandler.METHODS.includes(methodName) && this.normalizedRequest.jsonBody) {
      try {
        methodName = this.normalizedRequest.jsonBody.method;
      } catch {
      }
    }
    return methodName;
  }
  // checks that a single field meets validation requirements
  // currently checks for presence only
  _validateField(name, value) {
    if (!value || value.trim() === "") {
      throw new DbAuthError.FieldRequiredError(
        name,
        this.options.signup?.errors?.fieldMissing
      );
    } else {
      return true;
    }
  }
  _loginResponse(user, statusCode = 200) {
    const sessionData = this._sanitizeUser(user);
    const csrfToken = DbAuthHandler.CSRF_TOKEN;
    const headers = new Headers();
    headers.append("csrf-token", csrfToken);
    headers.append("set-cookie", this._createAuthProviderCookieString());
    headers.append(
      "set-cookie",
      this._createSessionCookieString(sessionData, csrfToken)
    );
    return [sessionData, headers, { statusCode }];
  }
  _logoutResponse(response) {
    return [response ? JSON.stringify(response) : "", this._deleteSessionHeader];
  }
  _ok(body, headers = new Headers(), options = { statusCode: 200 }) {
    headers.append("content-type", "application/json");
    return {
      statusCode: options.statusCode,
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers
    };
  }
  _notFound() {
    return {
      statusCode: 404
    };
  }
  _badRequest(message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: message }),
      headers: new Headers({ "content-type": "application/json" })
    };
  }
  _getUserMatchCriteriaOptions(username, usernameMatchFlowOption) {
    const findUniqueUserMatchCriteriaOptions = !usernameMatchFlowOption ? { [this.options.authFields.username]: username } : {
      [this.options.authFields.username]: {
        equals: username,
        mode: usernameMatchFlowOption
      }
    };
    return findUniqueUserMatchCriteriaOptions;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DbAuthHandler
});
