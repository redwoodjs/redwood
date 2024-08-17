"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.WrongVerbError = exports.WebAuthnError = exports.UsernameRequiredError = exports.UsernameNotFoundError = exports.UsernameAndPasswordRequiredError = exports.UserNotFoundError = exports.UnknownAuthMethodError = exports.SessionDecryptionError = exports.ReusedPasswordError = exports.ResetTokenRequiredError = exports.ResetTokenInvalidError = exports.ResetTokenExpiredError = exports.PasswordValidationError = exports.PasswordRequiredError = exports.NotLoggedInError = exports.NoWebAuthnSessionError = exports.NoWebAuthnConfigError = exports.NoUserIdError = exports.NoSignupHandlerError = exports.NoSessionSecretError = exports.NoSessionExpirationError = exports.NoResetPasswordHandlerError = exports.NoLoginHandlerError = exports.NoForgotPasswordHandlerError = exports.MissingWebAuthnConfigError = exports.IncorrectPasswordError = exports.GenericError = exports.FlowNotEnabledError = exports.FieldRequiredError = exports.DuplicateUsernameError = exports.CsrfTokenMismatchError = void 0;
class NoSessionSecretError extends Error {
  constructor() {
    super('dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!');
    this.name = 'NoSessionSecretError';
  }
}
exports.NoSessionSecretError = NoSessionSecretError;
class NoSessionExpirationError extends Error {
  constructor() {
    super('dbAuth requires login expiration time, in seconds');
    this.name = 'NoSessionExpirationError';
  }
}
exports.NoSessionExpirationError = NoSessionExpirationError;
class NoLoginHandlerError extends Error {
  constructor() {
    super('dbAuth requires a login handler in order to log in a user');
    this.name = 'NoLoginHandlerError';
  }
}
exports.NoLoginHandlerError = NoLoginHandlerError;
class NoSignupHandlerError extends Error {
  constructor() {
    super('dbAuth requires a signup handler in order to create new users');
    this.name = 'NoSignupHandlerError';
  }
}
exports.NoSignupHandlerError = NoSignupHandlerError;
class NoForgotPasswordHandlerError extends Error {
  constructor() {
    super('dbAuth requires a forgot password handler in order to notify user');
    this.name = 'NoForgotPasswordHandlerError';
  }
}
exports.NoForgotPasswordHandlerError = NoForgotPasswordHandlerError;
class NoResetPasswordHandlerError extends Error {
  constructor() {
    super('dbAuth requires a reset password handler in order to notify user');
    this.name = 'NoResetPasswordHandlerError';
  }
}
exports.NoResetPasswordHandlerError = NoResetPasswordHandlerError;
class NoWebAuthnConfigError extends Error {
  constructor() {
    super('To use Webauthn you need both `webauthn` and `credentialModelAccessor` config options, see https://redwoodjs.com/docs/auth/dbAuth#webauthn');
    this.name = 'NoWebAuthnConfigError';
  }
}
exports.NoWebAuthnConfigError = NoWebAuthnConfigError;
class MissingWebAuthnConfigError extends Error {
  constructor() {
    super('You are missing one or more WebAuthn config options, see https://redwoodjs.com/docs/auth/dbAuth#webauthn');
    this.name = 'MissingWebAuthnConfigError';
  }
}
exports.MissingWebAuthnConfigError = MissingWebAuthnConfigError;
class UnknownAuthMethodError extends Error {
  constructor(name) {
    super(`Unknown auth method '${name}'`);
    this.name = 'UnknownAuthMethodError';
  }
}
exports.UnknownAuthMethodError = UnknownAuthMethodError;
class WrongVerbError extends Error {
  constructor(properVerb) {
    super(`Only accessible via ${properVerb}`);
    this.name = 'WrongVerbError';
  }
}
exports.WrongVerbError = WrongVerbError;
class NotLoggedInError extends Error {
  constructor() {
    super(`Cannot retrieve user details without being logged in`);
    this.name = 'NotLoggedInError';
  }
}
exports.NotLoggedInError = NotLoggedInError;
class UserNotFoundError extends Error {
  constructor(username = undefined, message = 'Username ${username} not found') {
    if (username) {
      super(message.replace(/\$\{username\}/g, username));
    } else {
      super(`User not found`);
    }
    this.name = 'UserNotFoundError';
  }
}
exports.UserNotFoundError = UserNotFoundError;
class UsernameAndPasswordRequiredError extends Error {
  constructor(message = 'Both username and password are required') {
    super(message);
    this.name = 'UsernameAndPasswordRequiredError';
  }
}
exports.UsernameAndPasswordRequiredError = UsernameAndPasswordRequiredError;
class NoUserIdError extends Error {
  constructor() {
    super('loginHandler() must return an object with an `id` field as set in `authFields.id`');
    this.name = 'NoUserIdError';
  }
}
exports.NoUserIdError = NoUserIdError;
class FieldRequiredError extends Error {
  constructor(name, message = '${field} is required') {
    super(message.replace(/\$\{field\}/g, name));
    this.name = 'FieldRequiredError';
  }
}
exports.FieldRequiredError = FieldRequiredError;
class DuplicateUsernameError extends Error {
  constructor(username, message = 'Username `${username}` already in use') {
    super(message.replace(/\$\{username\}/g, username));
    this.name = 'DuplicateUsernameError';
  }
}
exports.DuplicateUsernameError = DuplicateUsernameError;
class IncorrectPasswordError extends Error {
  constructor(username, message = 'Incorrect password for ${username}') {
    super(message.replace(/\$\{username\}/g, username));
    this.name = 'IncorrectPasswordError';
  }
}
exports.IncorrectPasswordError = IncorrectPasswordError;
class CsrfTokenMismatchError extends Error {
  constructor() {
    super(`CSRF token mismatch`);
    this.name = 'CsrfTokenMismatchError';
  }
}
exports.CsrfTokenMismatchError = CsrfTokenMismatchError;
class SessionDecryptionError extends Error {
  constructor() {
    super('Session has potentially been tampered with');
    this.name = 'SessionDecryptionError';
  }
}
exports.SessionDecryptionError = SessionDecryptionError;
class FlowNotEnabledError extends Error {
  constructor(message = 'Flow is not enabled') {
    super(message);
    this.name = 'FlowNotEnabledError';
  }
}
exports.FlowNotEnabledError = FlowNotEnabledError;
class UsernameRequiredError extends Error {
  constructor(message = 'Username is required') {
    super(message);
    this.name = 'UsernameRequiredError';
  }
}
exports.UsernameRequiredError = UsernameRequiredError;
class PasswordRequiredError extends Error {
  constructor(message = 'Password is required') {
    super(message);
    this.name = 'PasswordRequiredError';
  }
}
exports.PasswordRequiredError = PasswordRequiredError;
class UsernameNotFoundError extends Error {
  constructor(message = 'Username not found') {
    super(message);
    this.name = 'UsernameNotFoundError';
  }
}
exports.UsernameNotFoundError = UsernameNotFoundError;
class ResetTokenExpiredError extends Error {
  constructor(message = 'resetToken is expired') {
    super(message);
    this.name = 'ResetTokenExpiredError';
  }
}
exports.ResetTokenExpiredError = ResetTokenExpiredError;
class ResetTokenInvalidError extends Error {
  constructor(message = 'resetToken is invalid') {
    super(message);
    this.name = 'ResetTokenInvalidError';
  }
}
exports.ResetTokenInvalidError = ResetTokenInvalidError;
class ResetTokenRequiredError extends Error {
  constructor(message = 'resetToken is required') {
    super(message);
    this.name = 'ResetTokenRequiredError';
  }
}
exports.ResetTokenRequiredError = ResetTokenRequiredError;
class ReusedPasswordError extends Error {
  constructor(message = 'Must choose a new password') {
    super(message);
    this.name = 'ReusedPasswordError';
  }
}
exports.ReusedPasswordError = ReusedPasswordError;
class PasswordValidationError extends Error {
  constructor(message = 'Password is invalid') {
    super(message);
    this.name = 'PasswordValidationError';
  }
}
exports.PasswordValidationError = PasswordValidationError;
class GenericError extends Error {
  constructor(message = 'unknown error occurred') {
    super(message);
    this.name = 'GenericError';
  }
}
exports.GenericError = GenericError;
class WebAuthnError extends Error {
  constructor(message = 'WebAuthn Error') {
    super(message);
    this.name = 'WebAuthnError';
  }
}
exports.WebAuthnError = WebAuthnError;
class NoWebAuthnSessionError extends WebAuthnError {
  constructor(message = 'Log in with username and password to enable WebAuthn') {
    super(message);
    this.name = 'NoWebAuthnSessionError';
  }
}
exports.NoWebAuthnSessionError = NoWebAuthnSessionError;