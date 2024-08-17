export declare class NoSessionSecretError extends Error {
    constructor();
}
export declare class NoSessionExpirationError extends Error {
    constructor();
}
export declare class NoLoginHandlerError extends Error {
    constructor();
}
export declare class NoSignupHandlerError extends Error {
    constructor();
}
export declare class NoForgotPasswordHandlerError extends Error {
    constructor();
}
export declare class NoResetPasswordHandlerError extends Error {
    constructor();
}
export declare class NoWebAuthnConfigError extends Error {
    constructor();
}
export declare class MissingWebAuthnConfigError extends Error {
    constructor();
}
export declare class UnknownAuthMethodError extends Error {
    constructor(name: string);
}
export declare class WrongVerbError extends Error {
    constructor(properVerb: string);
}
export declare class NotLoggedInError extends Error {
    constructor();
}
export declare class UserNotFoundError extends Error {
    constructor(username?: string | undefined, message?: string | undefined);
}
export declare class UsernameAndPasswordRequiredError extends Error {
    constructor(message?: string | undefined);
}
export declare class NoUserIdError extends Error {
    constructor();
}
export declare class FieldRequiredError extends Error {
    constructor(name: string, message?: string | undefined);
}
export declare class DuplicateUsernameError extends Error {
    constructor(username: string, message?: string | undefined);
}
export declare class IncorrectPasswordError extends Error {
    constructor(username: string, message?: string | undefined);
}
export declare class CsrfTokenMismatchError extends Error {
    constructor();
}
export declare class SessionDecryptionError extends Error {
    constructor();
}
export declare class FlowNotEnabledError extends Error {
    constructor(message?: string);
}
export declare class UsernameRequiredError extends Error {
    constructor(message?: string);
}
export declare class PasswordRequiredError extends Error {
    constructor(message?: string);
}
export declare class UsernameNotFoundError extends Error {
    constructor(message?: string);
}
export declare class ResetTokenExpiredError extends Error {
    constructor(message?: string);
}
export declare class ResetTokenInvalidError extends Error {
    constructor(message?: string);
}
export declare class ResetTokenRequiredError extends Error {
    constructor(message?: string);
}
export declare class ReusedPasswordError extends Error {
    constructor(message?: string);
}
export declare class PasswordValidationError extends Error {
    constructor(message?: string);
}
export declare class GenericError extends Error {
    constructor(message?: string);
}
export declare class WebAuthnError extends Error {
    constructor(message?: string);
}
export declare class NoWebAuthnSessionError extends WebAuthnError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map