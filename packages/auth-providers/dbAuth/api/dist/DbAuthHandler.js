"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.DbAuthHandler = void 0;
require("core-js/modules/es.array.push.js");
require("core-js/modules/esnext.json.parse.js");
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _trim = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/trim"));
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/assign"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/keys"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _base64url = _interopRequireDefault(require("base64url"));
var _md = _interopRequireDefault(require("md5"));
var _uuid = require("uuid");
var _api = require("@redwoodjs/api");
var DbAuthError = _interopRequireWildcard(require("./errors"));
var _shared = require("./shared");
const DEFAULT_ALLOWED_USER_FIELDS = ['id', 'email'];
class DbAuthHandler {
  get normalizedRequest() {
    if (!this._normalizedRequest) {
      // This is a dev time error, no need to throw a specialized error
      throw new Error('dbAuthHandler has not been initialized. Either await ' + 'dbAuthHandler.invoke() or call await dbAuth.init()');
    }
    return this._normalizedRequest;
  }

  // class constant: list of auth methods that are supported
  static get METHODS() {
    return ['forgotPassword', 'getToken', 'login', 'logout', 'resetPassword', 'signup', 'validateResetToken', 'webAuthnRegOptions', 'webAuthnRegister', 'webAuthnAuthOptions', 'webAuthnAuthenticate'];
  }

  // class constant: maps the auth functions to their required HTTP verb for access
  static get VERBS() {
    return {
      forgotPassword: 'POST',
      getToken: 'GET',
      login: 'POST',
      logout: 'POST',
      resetPassword: 'POST',
      signup: 'POST',
      validateResetToken: 'POST',
      webAuthnRegOptions: 'GET',
      webAuthnRegister: 'POST',
      webAuthnAuthOptions: 'GET',
      webAuthnAuthenticate: 'POST'
    };
  }

  // default to epoch when we want to expire
  static get PAST_EXPIRES_DATE() {
    return new Date('1970-01-01T00:00:00.000+00:00').toUTCString();
  }

  // generate a new token (standard UUID)
  static get CSRF_TOKEN() {
    return (0, _uuid.v4)();
  }
  static get AVAILABLE_WEBAUTHN_TRANSPORTS() {
    return ['usb', 'ble', 'nfc', 'internal'];
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
    deleteHeaders.append('set-cookie', [`${(0, _shared.cookieName)(this.options.cookie?.name)}=`, ...this._cookieAttributes({
      expires: 'now'
    })].join(';'));
    deleteHeaders.append('set-cookie', [`auth-provider=`, ...this._cookieAttributes({
      expires: 'now'
    })].join(';'));
    return deleteHeaders;
  }
  constructor(event, _context,
  // @TODO:
  options) {
    this.event = void 0;
    this._normalizedRequest = void 0;
    this.httpMethod = void 0;
    this.options = void 0;
    this.cookie = void 0;
    this.db = void 0;
    this.dbAccessor = void 0;
    this.dbCredentialAccessor = void 0;
    this.allowedUserFields = void 0;
    this.hasInvalidSession = void 0;
    this.session = void 0;
    this.sessionCsrfToken = void 0;
    this.corsContext = void 0;
    this.sessionExpiresDate = void 0;
    this.webAuthnExpiresDate = void 0;
    this.encryptedSession = null;
    this.createResponse = void 0;
    this.options = options;
    this.event = event;
    this.httpMethod = (0, _api.isFetchApiRequest)(event) ? event.method : event.httpMethod;
    this.cookie = (0, _shared.extractCookie)(event) || '';
    this.createResponse = (0, _shared.getDbAuthResponseBuilder)(event);
    this._validateOptions();
    this.db = this.options.db;
    this.dbAccessor = this.db[this.options.authModelAccessor];
    this.dbCredentialAccessor = this.options.credentialModelAccessor ? this.db[this.options.credentialModelAccessor] : null;
    this.hasInvalidSession = false;
    this.allowedUserFields = this.options.allowedUserFields || DEFAULT_ALLOWED_USER_FIELDS;
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setSeconds(sessionExpiresAt.getSeconds() + this.options.login.expires);
    this.sessionExpiresDate = sessionExpiresAt.toUTCString();
    const webAuthnExpiresAt = new Date();
    webAuthnExpiresAt.setSeconds(webAuthnExpiresAt.getSeconds() + (this.options?.webAuthn?.expires || 0));
    this.webAuthnExpiresDate = webAuthnExpiresAt.toUTCString();

    // Note that we handle these headers differently in functions/graphql.ts
    // because it's handled by graphql-yoga, so we map the cors config to yoga config
    // See packages/graphql-server/src/__tests__/mapRwCorsToYoga.test.ts
    if (options.cors) {
      this.corsContext = (0, _api.createCorsContext)(options.cors);
    }
    try {
      this.encryptedSession = (0, _shared.getSession)(this.cookie, this.options.cookie?.name);
      const [session, csrfToken] = (0, _shared.decryptSession)(this.encryptedSession);
      this.session = session;
      this.sessionCsrfToken = csrfToken;
    } catch (e) {
      // if session can't be decrypted, keep track so we can log them out when
      // the auth method is called
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
      this._normalizedRequest = await (0, _api.normalizeRequest)(this.event);
    }
  }

  // Actual function that triggers everything else to happen: `login`, `signup`,
  // etc. is called from here, after some checks to make sure the request is good
  async invoke() {
    let corsHeaders = {};
    await this.init();
    if (this.corsContext) {
      corsHeaders = this.corsContext.getRequestHeaders(this.normalizedRequest);
      // Return CORS headers for OPTIONS requests
      if (this.corsContext.shouldHandleCors(this.normalizedRequest)) {
        return this.createResponse({
          body: '',
          statusCode: 200
        }, corsHeaders);
      }
    }

    // if there was a problem decryption the session, just return the logout
    // response immediately
    if (this.hasInvalidSession) {
      return this.createResponse(this._ok(...this._logoutResponse()), corsHeaders);
    }
    try {
      var _context2;
      const method = await this._getAuthMethod();

      // get the auth method the incoming request is trying to call
      if (!(0, _includes.default)(_context2 = DbAuthHandler.METHODS).call(_context2, method)) {
        return this.createResponse(this._notFound(), corsHeaders);
      }

      // make sure it's using the correct verb, GET vs POST
      if (this.httpMethod !== DbAuthHandler.VERBS[method]) {
        return this.createResponse(this._notFound(), corsHeaders);
      }

      // call whatever auth method was requested and return the body and headers
      const [body, headers, options = {
        statusCode: 200
      }] = await this[method]();
      return this.createResponse(this._ok(body, headers, options), corsHeaders);
    } catch (e) {
      if (e instanceof DbAuthError.WrongVerbError) {
        return this.createResponse(this._notFound(), corsHeaders);
      } else {
        return this.createResponse(this._badRequest(e.message || e), corsHeaders);
      }
    }
  }
  async forgotPassword() {
    const {
      enabled = true
    } = this.options.forgotPassword;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(this.options.forgotPassword?.errors?.flowNotEnabled || `Forgot password flow is not enabled`);
    }
    const {
      username
    } = this.normalizedRequest.jsonBody || {};
    // was the username sent in at all?
    if (!username || (0, _trim.default)(username).call(username) === '') {
      throw new DbAuthError.UsernameRequiredError(this.options.forgotPassword?.errors?.usernameRequired || `Username is required`);
    }
    let user;
    try {
      user = await this.dbAccessor.findUnique({
        where: {
          [this.options.authFields.username]: username
        }
      });
    } catch {
      throw new DbAuthError.GenericError();
    }
    if (user) {
      const tokenExpires = new Date();
      tokenExpires.setSeconds(tokenExpires.getSeconds() + this.options.forgotPassword.expires);

      // generate a token
      let token = (0, _md.default)((0, _uuid.v4)());
      const buffer = Buffer.from(token);
      token = buffer.toString('base64').replace('=', '').substring(0, 16);

      // Store the token hash in the database so we can verify it later
      const tokenHash = (0, _shared.hashToken)(token);
      try {
        // set token and expires time
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

      // call user-defined handler in their functions/auth.js
      const response = await this.options.forgotPassword.handler(this._sanitizeUser(user), token);
      return [response ? (0, _stringify.default)(response) : '', this._deleteSessionHeader];
    } else {
      throw new DbAuthError.UsernameNotFoundError(this.options.forgotPassword?.errors?.usernameNotFound || `Username '${username} not found`);
    }
  }
  async getToken() {
    try {
      const user = await this._getCurrentUser();
      let headers = new Headers();

      // if the session was encrypted with the old algorithm, re-encrypt it
      // with the new one
      if ((0, _shared.isLegacySession)(this.cookie)) {
        headers = this._loginResponse(user)[1];
      }
      return [user[this.options.authFields.id], headers];
    } catch (e) {
      if (e instanceof DbAuthError.NotLoggedInError) {
        return this._logoutResponse();
      } else {
        return this._logoutResponse({
          error: e.message
        });
      }
    }
  }
  async login() {
    const {
      enabled = true
    } = this.options.login;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(this.options.login?.errors?.flowNotEnabled || `Login flow is not enabled`);
    }
    const {
      username,
      password
    } = this.normalizedRequest.jsonBody || {};
    const dbUser = await this._verifyUser(username, password);
    const handlerUser = await this.options.login.handler(dbUser);
    if (handlerUser?.[this.options.authFields.id] == null) {
      throw new DbAuthError.NoUserIdError();
    }
    return this._loginResponse(handlerUser);
  }
  logout() {
    return this._logoutResponse();
  }
  async resetPassword() {
    var _context3, _context4;
    const {
      enabled = true
    } = this.options.resetPassword;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(this.options.resetPassword?.errors?.flowNotEnabled || `Reset password flow is not enabled`);
    }
    const {
      password,
      resetToken
    } = this.normalizedRequest.jsonBody || {};

    // is the resetToken present?
    if (resetToken == null || (0, _trim.default)(_context3 = String(resetToken)).call(_context3) === '') {
      throw new DbAuthError.ResetTokenRequiredError(this.options.resetPassword?.errors?.resetTokenRequired);
    }

    // is password present?
    if (password == null || (0, _trim.default)(_context4 = String(password)).call(_context4) === '') {
      throw new DbAuthError.PasswordRequiredError();
    }

    // check if password is valid using signup criteria
    ;
    this.options.signup.passwordValidation?.(password);
    let user = await this._findUserByToken(resetToken);
    const [hashedPassword] = (0, _shared.hashPassword)(password, {
      salt: user.salt
    });
    const [legacyHashedPassword] = (0, _shared.legacyHashPassword)(password, user.salt);
    if (!this.options.resetPassword.allowReusedPassword && user.hashedPassword === hashedPassword || user.hashedPassword === legacyHashedPassword) {
      throw new DbAuthError.ReusedPasswordError(this.options.resetPassword?.errors?.reusedPassword);
    }
    try {
      // if we got here then we can update the password in the database
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

    // call the user-defined handler so they can decide what to do with this user
    const response = await this.options.resetPassword.handler(this._sanitizeUser(user));

    // returning the user from the handler means to log them in automatically
    if (response) {
      return this._loginResponse(user);
    } else {
      return this._logoutResponse({});
    }
  }
  async signup() {
    const {
      enabled = true
    } = this.options.signup;
    if (!enabled) {
      throw new DbAuthError.FlowNotEnabledError(this.options.signup?.errors?.flowNotEnabled || `Signup flow is not enabled`);
    }

    // check if password is valid
    const {
      password
    } = this.normalizedRequest.jsonBody || {};
    this.options.signup.passwordValidation?.(password);
    const userOrMessage = await this._createUser();

    // at this point `user` is either an actual user, in which case log the
    // user in automatically, or it's a string, which is a message to show
    // the user (something like "please verify your email")
    if (typeof userOrMessage === 'object') {
      const user = userOrMessage;
      return this._loginResponse(user, 201);
    } else {
      const message = userOrMessage;
      return [(0, _stringify.default)({
        message
      }), new Headers(), {
        statusCode: 201
      }];
    }
  }
  async validateResetToken() {
    var _context5;
    const {
      resetToken
    } = this.normalizedRequest.jsonBody || {};
    // is token present at all?
    if (!resetToken || (0, _trim.default)(_context5 = String(resetToken)).call(_context5) === '') {
      throw new DbAuthError.ResetTokenRequiredError(this.options.resetPassword?.errors?.resetTokenRequired);
    }
    const user = await this._findUserByToken(resetToken);
    return [(0, _stringify.default)(this._sanitizeUser(user)), this._deleteSessionHeader];
  }

  // browser submits WebAuthn credentials
  async webAuthnAuthenticate() {
    const {
      verifyAuthenticationResponse
    } = await import('@simplewebauthn/server');
    const webAuthnOptions = this.options.webAuthn;
    const {
      rawId
    } = this.normalizedRequest.jsonBody || {};
    if (!rawId) {
      throw new DbAuthError.WebAuthnError('Missing Id in request');
    }
    if (!webAuthnOptions?.enabled) {
      throw new DbAuthError.WebAuthnError('WebAuthn is not enabled');
    }
    const credential = await this.dbCredentialAccessor.findFirst({
      where: {
        id: rawId
      }
    });
    if (!credential) {
      throw new DbAuthError.WebAuthnError('Credentials not found');
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
          credentialID: _base64url.default.toBuffer(credential[webAuthnOptions.credentialFields.id]),
          credentialPublicKey: credential[webAuthnOptions.credentialFields.publicKey],
          counter: credential[webAuthnOptions.credentialFields.counter],
          transports: credential[webAuthnOptions.credentialFields.transports] ? JSON.parse(credential[webAuthnOptions.credentialFields.transports]) : DbAuthHandler.AVAILABLE_WEBAUTHN_TRANSPORTS
        },
        requireUserVerification: true
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (e) {
      throw new DbAuthError.WebAuthnError(e.message);
    } finally {
      // whether it worked or errored, clear the challenge in the user record
      // and user can get a new one next time they try to authenticate
      await this._saveChallenge(user[this.options.authFields.id], null);
    }
    const {
      verified,
      authenticationInfo
    } = verification;
    if (verified) {
      // update counter in credentials
      await this.dbCredentialAccessor.update({
        where: {
          [webAuthnOptions.credentialFields.id]: credential[webAuthnOptions.credentialFields.id]
        },
        data: {
          [webAuthnOptions.credentialFields.counter]: authenticationInfo.newCounter
        }
      });
    }

    // get the regular `login` cookies
    const [, headers] = this._loginResponse(user);

    // Now add the webAuthN cookies
    headers.append('set-cookie', this._webAuthnCookie(rawId, this.webAuthnExpiresDate));
    return [verified, headers];
  }

  // get options for a WebAuthn authentication
  async webAuthnAuthOptions() {
    const {
      generateAuthenticationOptions
    } = await import('@simplewebauthn/server');
    if (!this.options.webAuthn?.enabled) {
      throw new DbAuthError.WebAuthnError('WebAuthn is not enabled');
    }
    const webAuthnOptions = this.options.webAuthn;
    const credentialId = (0, _shared.webAuthnSession)(this.event);
    let user;
    if (credentialId) {
      user = await this.dbCredentialAccessor.findFirst({
        where: {
          [webAuthnOptions.credentialFields.id]: credentialId
        }
      }).user();
    } else {
      // webauthn session not present, fallback to getting user from regular
      // session cookie
      user = await this._getCurrentUser();
    }

    // webauthn cookie has been tampered with or UserCredential has been deleted
    // from the DB, remove their cookie so it doesn't happen again
    if (!user) {
      return [{
        error: 'Log in with username and password to enable WebAuthn'
      }, new Headers([['set-cookie', this._webAuthnCookie('', 'now')]]), {
        statusCode: 400
      }];
    }
    const credentials = await this.dbCredentialAccessor.findMany({
      where: {
        [webAuthnOptions.credentialFields.userId]: user[this.options.authFields.id]
      }
    });
    const someOptions = {
      timeout: webAuthnOptions.timeout || 60000,
      allowCredentials: (0, _map.default)(credentials).call(credentials, cred => ({
        id: _base64url.default.toBuffer(cred[webAuthnOptions.credentialFields.id]),
        type: 'public-key',
        transports: cred[webAuthnOptions.credentialFields.transports] ? JSON.parse(cred[webAuthnOptions.credentialFields.transports]) : DbAuthHandler.AVAILABLE_WEBAUTHN_TRANSPORTS
      })),
      userVerification: 'required',
      rpID: webAuthnOptions.domain
    };
    const authOptions = generateAuthenticationOptions(someOptions);
    await this._saveChallenge(user[this.options.authFields.id], authOptions.challenge);
    return [authOptions];
  }

  // get options for WebAuthn registration
  async webAuthnRegOptions() {
    const {
      generateRegistrationOptions
    } = await import('@simplewebauthn/server');
    if (!this.options?.webAuthn?.enabled) {
      throw new DbAuthError.WebAuthnError('WebAuthn is not enabled');
    }
    const webAuthnOptions = this.options.webAuthn;
    const user = await this._getCurrentUser();
    const options = {
      rpName: webAuthnOptions.name,
      rpID: webAuthnOptions.domain,
      userID: user[this.options.authFields.id],
      userName: user[this.options.authFields.username],
      timeout: webAuthnOptions?.timeout || 60000,
      excludeCredentials: [],
      authenticatorSelection: {
        userVerification: 'required'
      },
      // Support the two most common algorithms: ES256, and RS256
      supportedAlgorithmIDs: [-7, -257]
    };

    // if a type is specified other than `any` assign it (the default behavior
    // of this prop if `undefined` means to allow any authenticator)
    if (webAuthnOptions.type && webAuthnOptions.type !== 'any') {
      options.authenticatorSelection = (0, _assign.default)(options.authenticatorSelection || {}, {
        authenticatorAttachment: webAuthnOptions.type
      });
    }
    const regOptions = generateRegistrationOptions(options);
    await this._saveChallenge(user[this.options.authFields.id], regOptions.challenge);
    return [regOptions];
  }

  // browser submits WebAuthn credentials for the first time on a new device
  async webAuthnRegister() {
    const {
      verifyRegistrationResponse
    } = await import('@simplewebauthn/server');
    if (!this.options.webAuthn?.enabled) {
      throw new DbAuthError.WebAuthnError('WebAuthn is not enabled');
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
    const {
      verified,
      registrationInfo
    } = verification;
    let plainCredentialId;
    if (verified && registrationInfo) {
      const {
        credentialPublicKey,
        credentialID,
        counter
      } = registrationInfo;
      plainCredentialId = _base64url.default.encode(Buffer.from(credentialID));
      const existingDevice = await this.dbCredentialAccessor.findFirst({
        where: {
          [this.options.webAuthn.credentialFields.id]: plainCredentialId,
          [this.options.webAuthn.credentialFields.userId]: user[this.options.authFields.id]
        }
      });
      if (!existingDevice) {
        const {
          transports
        } = this.normalizedRequest.jsonBody || {};
        await this.dbCredentialAccessor.create({
          data: {
            [this.options.webAuthn.credentialFields.id]: plainCredentialId,
            [this.options.webAuthn.credentialFields.userId]: user[this.options.authFields.id],
            [this.options.webAuthn.credentialFields.publicKey]: Buffer.from(credentialPublicKey),
            [this.options.webAuthn.credentialFields.transports]: transports ? (0, _stringify.default)(transports) : null,
            [this.options.webAuthn.credentialFields.counter]: counter
          }
        });
      }
    } else {
      throw new DbAuthError.WebAuthnError('Registration failed');
    }

    // clear challenge
    await this._saveChallenge(user[this.options.authFields.id], null);
    const headers = new Headers([['set-cookie', this._webAuthnCookie(plainCredentialId, this.webAuthnExpiresDate)]]);
    return [verified, headers];
  }

  // validates that we have all the ENV and options we need to login/signup
  _validateOptions() {
    // must have a SESSION_SECRET so we can encrypt/decrypt the cookie
    if (!process.env.SESSION_SECRET) {
      throw new DbAuthError.NoSessionSecretError();
    }

    // must have an expiration time set for the session cookie
    if (this.options?.login?.enabled !== false && !this.options?.login?.expires) {
      throw new DbAuthError.NoSessionExpirationError();
    }

    // must have a login handler to actually log a user in
    if (this.options?.login?.enabled !== false && !this.options?.login?.handler) {
      throw new DbAuthError.NoLoginHandlerError();
    }

    // must have a signup handler to define how to create a new user
    if (this.options?.signup?.enabled !== false && !this.options?.signup?.handler) {
      throw new DbAuthError.NoSignupHandlerError();
    }

    // must have a forgot password handler to define how to notify user of reset token
    if (this.options?.forgotPassword?.enabled !== false && !this.options?.forgotPassword?.handler) {
      throw new DbAuthError.NoForgotPasswordHandlerError();
    }

    // must have a reset password handler to define what to do with user once password changed
    if (this.options?.resetPassword?.enabled !== false && !this.options?.resetPassword?.handler) {
      throw new DbAuthError.NoResetPasswordHandlerError();
    }

    // must have webAuthn config if credentialModelAccessor present and vice versa
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
    return [`webAuthn=${id}`, ...this._cookieAttributes({
      expires,
      options: {
        HttpOnly: false
      }
    })].join(';');
  }

  // removes any fields not explicitly allowed to be sent to the client before
  // sending a response over the wire
  _sanitizeUser(user) {
    var _context6;
    const sanitized = JSON.parse((0, _stringify.default)(user));
    (0, _forEach.default)(_context6 = (0, _keys.default)(sanitized)).call(_context6, key => {
      var _context7;
      if (!(0, _includes.default)(_context7 = this.allowedUserFields).call(_context7, key)) {
        delete sanitized[key];
      }
    });
    return sanitized;
  }

  // Converts LambdaEvent or FetchRequest to
  _decodeEvent() {}

  // returns all the cookie attributes in an array with the proper expiration date
  //
  // pass the argument `expires` set to "now" to get the attributes needed to expire
  // the session, or "future" (or left out completely) to set to `futureExpiresDate`
  _cookieAttributes({
    expires = 'now',
    options = {}
  }) {
    var _context8, _context9;
    // TODO: When we drop support for specifying cookie attributes directly on
    // `options.cookie` we can get rid of all of this and just spread
    // `this.options.cookie?.attributes` directly into `cookieOptions` below
    const userCookieAttributes = this.options.cookie?.attributes ? {
      ...this.options.cookie?.attributes
    } : {
      ...this.options.cookie
    };
    if (!this.options.cookie?.attributes) {
      delete userCookieAttributes.name;
    }
    const cookieOptions = {
      ...userCookieAttributes,
      ...options
    } || {
      ...options
    };
    const meta = (0, _filter.default)(_context8 = (0, _map.default)(_context9 = (0, _keys.default)(cookieOptions)).call(_context9, key => {
      const optionValue = cookieOptions[key];

      // Convert the options to valid cookie string
      if (optionValue === true) {
        return key;
      } else if (optionValue === false) {
        return null;
      } else {
        return `${key}=${optionValue}`;
      }
    })).call(_context8, v => v);
    const expiresAt = expires === 'now' ? DbAuthHandler.PAST_EXPIRES_DATE : expires;
    meta.push(`Expires=${expiresAt}`);
    return meta;
  }
  _createAuthProviderCookieString() {
    return [`auth-provider=dbAuth`, ...this._cookieAttributes({
      expires: this.sessionExpiresDate
    })].join(';');
  }

  // returns the set-cookie header to be returned in the request (effectively
  // creates the session)
  _createSessionCookieString(data, csrfToken) {
    const session = (0, _stringify.default)(data) + ';' + csrfToken;
    const encrypted = (0, _shared.encryptSession)(session);
    const sessionCookieString = [`${(0, _shared.cookieName)(this.options.cookie?.name)}=${encrypted}`, ...this._cookieAttributes({
      expires: this.sessionExpiresDate
    })].join(';');
    return sessionCookieString;
  }

  // checks the CSRF token in the header against the CSRF token in the session
  // and throw an error if they are not the same (not used yet)
  async _validateCsrf() {
    if (this.sessionCsrfToken !== this.normalizedRequest.headers.get('csrf-token')) {
      throw new DbAuthError.CsrfTokenMismatchError();
    }
    return true;
  }
  async _findUserByToken(token) {
    const tokenExpires = new Date();
    tokenExpires.setSeconds(tokenExpires.getSeconds() - this.options.forgotPassword.expires);
    const tokenHash = (0, _shared.hashToken)(token);
    const user = await this.dbAccessor.findFirst({
      where: {
        [this.options.authFields.resetToken]: tokenHash
      }
    });

    // user not found with the given token
    if (!user) {
      throw new DbAuthError.ResetTokenInvalidError(this.options.resetPassword?.errors?.resetTokenInvalid);
    }

    // token has expired
    if (user[this.options.authFields.resetTokenExpiresAt] < tokenExpires) {
      await this._clearResetToken(user);
      throw new DbAuthError.ResetTokenExpiredError(this.options.resetPassword?.errors?.resetTokenExpired);
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
    var _context10, _context11;
    // do we have all the query params we need to check the user?
    if (!username || (0, _trim.default)(_context10 = username.toString()).call(_context10) === '' || !password || (0, _trim.default)(_context11 = password.toString()).call(_context11) === '') {
      throw new DbAuthError.UsernameAndPasswordRequiredError(this.options.login?.errors?.usernameOrPasswordMissing);
    }
    const usernameMatchFlowOption = this.options.login?.usernameMatch;
    const findUniqueUserMatchCriteriaOptions = this._getUserMatchCriteriaOptions(username, usernameMatchFlowOption);
    let user;
    try {
      // does user exist?
      user = await this.dbAccessor.findFirst({
        where: findUniqueUserMatchCriteriaOptions
      });
    } catch {
      throw new DbAuthError.GenericError();
    }
    if (!user) {
      throw new DbAuthError.UserNotFoundError(username, this.options.login?.errors?.usernameNotFound);
    }
    await this._verifyPassword(user, password);
    return user;
  }

  // extracts scrypt strength options from hashed password (if present) and
  // compares the hashed plain text password just submitted using those options
  // with the one in the database. Falls back to the legacy CryptoJS algorihtm
  // if no options are present.
  async _verifyPassword(user, password) {
    const options = (0, _shared.extractHashingOptions)(user[this.options.authFields.hashedPassword]);
    if ((0, _keys.default)(options).length) {
      // hashed using the node:crypto algorithm
      const [hashedPassword] = (0, _shared.hashPassword)(password, {
        salt: user[this.options.authFields.salt],
        options
      });
      if (hashedPassword === user[this.options.authFields.hashedPassword]) {
        return user;
      }
    } else {
      // fallback to old CryptoJS hashing
      const [legacyHashedPassword] = (0, _shared.legacyHashPassword)(password, user[this.options.authFields.salt]);
      if (legacyHashedPassword === user[this.options.authFields.hashedPassword]) {
        const [newHashedPassword] = (0, _shared.hashPassword)(password, {
          salt: user[this.options.authFields.salt]
        });

        // update user's hash to the new algorithm
        await this.dbAccessor.update({
          where: {
            id: user.id
          },
          data: {
            [this.options.authFields.hashedPassword]: newHashedPassword
          }
        });
        return user;
      }
    }
    throw new DbAuthError.IncorrectPasswordError(user[this.options.authFields.username], this.options.login?.errors?.incorrectPassword);
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
    const {
      username,
      password,
      ...userAttributes
    } = this.normalizedRequest.jsonBody || {};
    if (this._validateField('username', username) && this._validateField('password', password)) {
      const usernameMatchFlowOption = this.options.signup?.usernameMatch;
      const findUniqueUserMatchCriteriaOptions = this._getUserMatchCriteriaOptions(username, usernameMatchFlowOption);
      const user = await this.dbAccessor.findFirst({
        where: findUniqueUserMatchCriteriaOptions
      });
      if (user) {
        throw new DbAuthError.DuplicateUsernameError(username, this.options.signup?.errors?.usernameTaken);
      }

      // if we get here everything is good, call the app's signup handler
      const [hashedPassword, salt] = (0, _shared.hashPassword)(password);
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
    var _context12;
    // try getting it from the query string, /.redwood/functions/auth?method=[methodName]
    let methodName = this.normalizedRequest.query?.method;
    if (!(0, _includes.default)(_context12 = DbAuthHandler.METHODS).call(_context12, methodName) && this.normalizedRequest.jsonBody) {
      // try getting it from the body in JSON: { method: [methodName] }
      try {
        methodName = this.normalizedRequest.jsonBody.method;
      } catch {
        // there's no body, or it's not JSON, `handler` will return a 404
      }
    }
    return methodName;
  }

  // checks that a single field meets validation requirements
  // currently checks for presence only
  _validateField(name, value) {
    // check for presence
    if (!value || (0, _trim.default)(value).call(value) === '') {
      throw new DbAuthError.FieldRequiredError(name, this.options.signup?.errors?.fieldMissing);
    } else {
      return true;
    }
  }
  _loginResponse(user, statusCode = 200) {
    const sessionData = this._sanitizeUser(user);

    // TODO: this needs to go into graphql somewhere so that each request makes a new CSRF token and sets it in both the encrypted session and the csrf-token header
    const csrfToken = DbAuthHandler.CSRF_TOKEN;
    const headers = new Headers();
    headers.append('csrf-token', csrfToken);
    headers.append('set-cookie', this._createAuthProviderCookieString());
    headers.append('set-cookie', this._createSessionCookieString(sessionData, csrfToken));
    return [sessionData, headers, {
      statusCode
    }];
  }
  _logoutResponse(response) {
    return [response ? (0, _stringify.default)(response) : '', this._deleteSessionHeader];
  }
  _ok(body, headers = new Headers(), options = {
    statusCode: 200
  }) {
    headers.append('content-type', 'application/json');
    return {
      statusCode: options.statusCode,
      body: typeof body === 'string' ? body : (0, _stringify.default)(body),
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
      body: (0, _stringify.default)({
        error: message
      }),
      headers: new Headers({
        'content-type': 'application/json'
      })
    };
  }
  _getUserMatchCriteriaOptions(username, usernameMatchFlowOption) {
    // Each db provider has it owns rules for case insensitive comparison.
    // We are checking if you have defined one for your db choice here
    // https://www.prisma.io/docs/concepts/components/prisma-client/case-sensitivity
    const findUniqueUserMatchCriteriaOptions = !usernameMatchFlowOption ? {
      [this.options.authFields.username]: username
    } : {
      [this.options.authFields.username]: {
        equals: username,
        mode: usernameMatchFlowOption
      }
    };
    return findUniqueUserMatchCriteriaOptions;
  }
}
exports.DbAuthHandler = DbAuthHandler;