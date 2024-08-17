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
var errors_exports = {};
__export(errors_exports, {
  CsrfTokenMismatchError: () => CsrfTokenMismatchError,
  DuplicateUsernameError: () => DuplicateUsernameError,
  FieldRequiredError: () => FieldRequiredError,
  FlowNotEnabledError: () => FlowNotEnabledError,
  GenericError: () => GenericError,
  IncorrectPasswordError: () => IncorrectPasswordError,
  MissingWebAuthnConfigError: () => MissingWebAuthnConfigError,
  NoForgotPasswordHandlerError: () => NoForgotPasswordHandlerError,
  NoLoginHandlerError: () => NoLoginHandlerError,
  NoResetPasswordHandlerError: () => NoResetPasswordHandlerError,
  NoSessionExpirationError: () => NoSessionExpirationError,
  NoSessionSecretError: () => NoSessionSecretError,
  NoSignupHandlerError: () => NoSignupHandlerError,
  NoUserIdError: () => NoUserIdError,
  NoWebAuthnConfigError: () => NoWebAuthnConfigError,
  NoWebAuthnSessionError: () => NoWebAuthnSessionError,
  NotLoggedInError: () => NotLoggedInError,
  PasswordRequiredError: () => PasswordRequiredError,
  PasswordValidationError: () => PasswordValidationError,
  ResetTokenExpiredError: () => ResetTokenExpiredError,
  ResetTokenInvalidError: () => ResetTokenInvalidError,
  ResetTokenRequiredError: () => ResetTokenRequiredError,
  ReusedPasswordError: () => ReusedPasswordError,
  SessionDecryptionError: () => SessionDecryptionError,
  UnknownAuthMethodError: () => UnknownAuthMethodError,
  UserNotFoundError: () => UserNotFoundError,
  UsernameAndPasswordRequiredError: () => UsernameAndPasswordRequiredError,
  UsernameNotFoundError: () => UsernameNotFoundError,
  UsernameRequiredError: () => UsernameRequiredError,
  WebAuthnError: () => WebAuthnError,
  WrongVerbError: () => WrongVerbError
});
module.exports = __toCommonJS(errors_exports);
class NoSessionSecretError extends Error {
  constructor() {
    super(
      "dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!"
    );
    this.name = "NoSessionSecretError";
  }
}
class NoSessionExpirationError extends Error {
  constructor() {
    super("dbAuth requires login expiration time, in seconds");
    this.name = "NoSessionExpirationError";
  }
}
class NoLoginHandlerError extends Error {
  constructor() {
    super("dbAuth requires a login handler in order to log in a user");
    this.name = "NoLoginHandlerError";
  }
}
class NoSignupHandlerError extends Error {
  constructor() {
    super("dbAuth requires a signup handler in order to create new users");
    this.name = "NoSignupHandlerError";
  }
}
class NoForgotPasswordHandlerError extends Error {
  constructor() {
    super("dbAuth requires a forgot password handler in order to notify user");
    this.name = "NoForgotPasswordHandlerError";
  }
}
class NoResetPasswordHandlerError extends Error {
  constructor() {
    super("dbAuth requires a reset password handler in order to notify user");
    this.name = "NoResetPasswordHandlerError";
  }
}
class NoWebAuthnConfigError extends Error {
  constructor() {
    super(
      "To use Webauthn you need both `webauthn` and `credentialModelAccessor` config options, see https://redwoodjs.com/docs/auth/dbAuth#webauthn"
    );
    this.name = "NoWebAuthnConfigError";
  }
}
class MissingWebAuthnConfigError extends Error {
  constructor() {
    super(
      "You are missing one or more WebAuthn config options, see https://redwoodjs.com/docs/auth/dbAuth#webauthn"
    );
    this.name = "MissingWebAuthnConfigError";
  }
}
class UnknownAuthMethodError extends Error {
  constructor(name) {
    super(`Unknown auth method '${name}'`);
    this.name = "UnknownAuthMethodError";
  }
}
class WrongVerbError extends Error {
  constructor(properVerb) {
    super(`Only accessible via ${properVerb}`);
    this.name = "WrongVerbError";
  }
}
class NotLoggedInError extends Error {
  constructor() {
    super(`Cannot retrieve user details without being logged in`);
    this.name = "NotLoggedInError";
  }
}
class UserNotFoundError extends Error {
  constructor(username = void 0, message = "Username ${username} not found") {
    if (username) {
      super(message.replace(/\$\{username\}/g, username));
    } else {
      super(`User not found`);
    }
    this.name = "UserNotFoundError";
  }
}
class UsernameAndPasswordRequiredError extends Error {
  constructor(message = "Both username and password are required") {
    super(message);
    this.name = "UsernameAndPasswordRequiredError";
  }
}
class NoUserIdError extends Error {
  constructor() {
    super(
      "loginHandler() must return an object with an `id` field as set in `authFields.id`"
    );
    this.name = "NoUserIdError";
  }
}
class FieldRequiredError extends Error {
  constructor(name, message = "${field} is required") {
    super(message.replace(/\$\{field\}/g, name));
    this.name = "FieldRequiredError";
  }
}
class DuplicateUsernameError extends Error {
  constructor(username, message = "Username `${username}` already in use") {
    super(message.replace(/\$\{username\}/g, username));
    this.name = "DuplicateUsernameError";
  }
}
class IncorrectPasswordError extends Error {
  constructor(username, message = "Incorrect password for ${username}") {
    super(message.replace(/\$\{username\}/g, username));
    this.name = "IncorrectPasswordError";
  }
}
class CsrfTokenMismatchError extends Error {
  constructor() {
    super(`CSRF token mismatch`);
    this.name = "CsrfTokenMismatchError";
  }
}
class SessionDecryptionError extends Error {
  constructor() {
    super("Session has potentially been tampered with");
    this.name = "SessionDecryptionError";
  }
}
class FlowNotEnabledError extends Error {
  constructor(message = "Flow is not enabled") {
    super(message);
    this.name = "FlowNotEnabledError";
  }
}
class UsernameRequiredError extends Error {
  constructor(message = "Username is required") {
    super(message);
    this.name = "UsernameRequiredError";
  }
}
class PasswordRequiredError extends Error {
  constructor(message = "Password is required") {
    super(message);
    this.name = "PasswordRequiredError";
  }
}
class UsernameNotFoundError extends Error {
  constructor(message = "Username not found") {
    super(message);
    this.name = "UsernameNotFoundError";
  }
}
class ResetTokenExpiredError extends Error {
  constructor(message = "resetToken is expired") {
    super(message);
    this.name = "ResetTokenExpiredError";
  }
}
class ResetTokenInvalidError extends Error {
  constructor(message = "resetToken is invalid") {
    super(message);
    this.name = "ResetTokenInvalidError";
  }
}
class ResetTokenRequiredError extends Error {
  constructor(message = "resetToken is required") {
    super(message);
    this.name = "ResetTokenRequiredError";
  }
}
class ReusedPasswordError extends Error {
  constructor(message = "Must choose a new password") {
    super(message);
    this.name = "ReusedPasswordError";
  }
}
class PasswordValidationError extends Error {
  constructor(message = "Password is invalid") {
    super(message);
    this.name = "PasswordValidationError";
  }
}
class GenericError extends Error {
  constructor(message = "unknown error occurred") {
    super(message);
    this.name = "GenericError";
  }
}
class WebAuthnError extends Error {
  constructor(message = "WebAuthn Error") {
    super(message);
    this.name = "WebAuthnError";
  }
}
class NoWebAuthnSessionError extends WebAuthnError {
  constructor(message = "Log in with username and password to enable WebAuthn") {
    super(message);
    this.name = "NoWebAuthnSessionError";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CsrfTokenMismatchError,
  DuplicateUsernameError,
  FieldRequiredError,
  FlowNotEnabledError,
  GenericError,
  IncorrectPasswordError,
  MissingWebAuthnConfigError,
  NoForgotPasswordHandlerError,
  NoLoginHandlerError,
  NoResetPasswordHandlerError,
  NoSessionExpirationError,
  NoSessionSecretError,
  NoSignupHandlerError,
  NoUserIdError,
  NoWebAuthnConfigError,
  NoWebAuthnSessionError,
  NotLoggedInError,
  PasswordRequiredError,
  PasswordValidationError,
  ResetTokenExpiredError,
  ResetTokenInvalidError,
  ResetTokenRequiredError,
  ReusedPasswordError,
  SessionDecryptionError,
  UnknownAuthMethodError,
  UserNotFoundError,
  UsernameAndPasswordRequiredError,
  UsernameNotFoundError,
  UsernameRequiredError,
  WebAuthnError,
  WrongVerbError
});
