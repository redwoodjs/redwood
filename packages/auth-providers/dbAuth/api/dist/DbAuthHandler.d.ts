import type { PrismaClient } from '@prisma/client';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/typescript-types';
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda';
import type { CorsConfig, CorsContext, PartialRequest } from '@redwoodjs/api';
interface SignupFlowOptions<TUserAttributes = Record<string, unknown>> {
    /**
     * Allow users to sign up. Defaults to true.
     * Needs to be explicitly set to false to disable the flow
     */
    enabled?: boolean;
    /**
     * Whatever you want to happen to your data on new user signup. Redwood will
     * check for duplicate usernames before calling this handler. At a minimum
     * you need to save the `username`, `hashedPassword` and `salt` to your
     * user table. `userAttributes` contains any additional object members that
     * were included in the object given to the `signUp()` function you got
     * from `useAuth()`
     */
    handler: (signupHandlerOptions: SignupHandlerOptions<TUserAttributes>) => any;
    /**
     * Validate the user-supplied password with whatever logic you want. Return
     * `true` if valid, throw `PasswordValidationError` if not.
     */
    passwordValidation?: (password: string) => boolean;
    /**
     * Object containing error strings
     */
    errors?: {
        fieldMissing?: string;
        usernameTaken?: string;
        flowNotEnabled?: string;
    };
    /**
     * Allows the user to define if the UserCheck for their selected db provider should use case insensitive
     */
    usernameMatch?: string;
}
interface ForgotPasswordFlowOptions<TUser = UserType> {
    /**
     * Allow users to request a new password via a call to forgotPassword. Defaults to true.
     * Needs to be explicitly set to false to disable the flow
     */
    enabled?: boolean;
    handler: (user: TUser, token: string) => any;
    errors?: {
        usernameNotFound?: string;
        usernameRequired?: string;
        flowNotEnabled?: string;
    };
    expires: number;
}
interface LoginFlowOptions<TUser = UserType> {
    /**
     * Allow users to login. Defaults to true.
     * Needs to be explicitly set to false to disable the flow
     */
    enabled?: boolean;
    /**
     * Anything you want to happen before logging the user in. This can include
     * throwing an error to prevent login. If you do want to allow login, this
     * function must return an object representing the user you want to be logged
     * in, containing at least an `id` field (whatever named field was provided
     * for `authFields.id`). For example: `return { id: user.id }`
     */
    handler: (user: TUser) => any;
    /**
     * Object containing error strings
     */
    errors?: {
        usernameOrPasswordMissing?: string;
        usernameNotFound?: string;
        incorrectPassword?: string;
        flowNotEnabled?: string;
    };
    /**
     * How long a user will remain logged in, in seconds
     */
    expires: number;
    /**
     * Allows the user to define if the UserCheck for their selected db provider should use case insensitive
     */
    usernameMatch?: string;
}
interface ResetPasswordFlowOptions<TUser = UserType> {
    /**
     * Allow users to reset their password via a code from a call to forgotPassword. Defaults to true.
     * Needs to be explicitly set to false to disable the flow
     */
    enabled?: boolean;
    handler: (user: TUser) => boolean | Promise<boolean>;
    allowReusedPassword: boolean;
    errors?: {
        resetTokenExpired?: string;
        resetTokenInvalid?: string;
        resetTokenRequired?: string;
        reusedPassword?: string;
        flowNotEnabled?: string;
    };
}
interface WebAuthnFlowOptions {
    enabled: boolean;
    expires: number;
    name: string;
    domain: string;
    origin: string;
    timeout?: number;
    type: 'any' | 'platform' | 'cross-platform';
    credentialFields: {
        id: string;
        userId: string;
        publicKey: string;
        transports: string;
        counter: string;
    };
}
export type UserType = Record<string | number, any>;
export type DbAuthResponse = Promise<{
    headers: {
        [x: string]: string | string[];
    };
    body?: string | undefined;
    statusCode: number;
}>;
type AuthMethodOutput = [
    string | Record<string, any> | boolean | undefined,
    Headers?,
    {
        statusCode: number;
    }?
];
export interface DbAuthHandlerOptions<TUser = UserType, TUserAttributes = Record<string, unknown>> {
    /**
     * Provide prisma db client
     */
    db: PrismaClient;
    /**
     * The name of the property you'd call on `db` to access your user table.
     * ie. if your Prisma model is named `User` this value would be `user`, as in `db.user`
     */
    authModelAccessor: keyof PrismaClient;
    /**
     * The name of the property you'd call on `db` to access your user credentials table.
     * ie. if your Prisma model is named `UserCredential` this value would be `userCredential`, as in `db.userCredential`
     */
    credentialModelAccessor?: keyof PrismaClient;
    /**
     * The fields that are allowed to be returned from the user table when
     * invoking handlers that return a user object (like forgotPassword and signup)
     * Defaults to `id` and `email` if not set at all.
     */
    allowedUserFields?: string[];
    /**
     *  A map of what dbAuth calls a field to what your database calls it.
     * `id` is whatever column you use to uniquely identify a user (probably
     * something like `id` or `userId` or even `email`)
     */
    authFields: {
        id: string;
        username: string;
        hashedPassword: string;
        salt: string;
        resetToken: string;
        resetTokenExpiresAt: string;
        challenge?: string;
    };
    /**
     * Object containing cookie config options
     */
    cookie?: {
        /** @deprecated set this option in `cookie.attributes` */
        Path?: string;
        /** @deprecated set this option in `cookie.attributes` */
        HttpOnly?: boolean;
        /** @deprecated set this option in `cookie.attributes` */
        Secure?: boolean;
        /** @deprecated set this option in `cookie.attributes` */
        SameSite?: string;
        /** @deprecated set this option in `cookie.attributes` */
        Domain?: string;
        attributes?: {
            Path?: string;
            HttpOnly?: boolean;
            Secure?: boolean;
            SameSite?: string;
            Domain?: string;
        };
        /**
         * The name of the cookie that dbAuth sets
         *
         * %port% will be replaced with the port the api server is running on.
         * If you have multiple RW apps running on the same host, you'll need to
         * make sure they all use unique cookie names
         */
        name?: string;
    };
    /**
     * Object containing forgot password options
     */
    forgotPassword: ForgotPasswordFlowOptions<TUser> | {
        enabled: false;
    };
    /**
     * Object containing login options
     */
    login: LoginFlowOptions<TUser> | {
        enabled: false;
    };
    /**
     * Object containing reset password options
     */
    resetPassword: ResetPasswordFlowOptions<TUser> | {
        enabled: false;
    };
    /**
     * Object containing login options
     */
    signup: SignupFlowOptions<TUserAttributes> | {
        enabled: false;
    };
    /**
     * Object containing WebAuthn options
     */
    webAuthn?: WebAuthnFlowOptions | {
        enabled: false;
    };
    /**
     * CORS settings, same as in createGraphqlHandler
     */
    cors?: CorsConfig;
}
export interface SignupHandlerOptions<TUserAttributes> {
    username: string;
    hashedPassword: string;
    salt: string;
    userAttributes?: TUserAttributes;
}
export type AuthMethodNames = 'forgotPassword' | 'getToken' | 'login' | 'logout' | 'resetPassword' | 'signup' | 'webAuthnAuthenticate' | 'webAuthnAuthOptions' | 'webAuthnRegOptions' | 'webAuthnRegister' | 'validateResetToken';
type Params = AuthenticationResponseJSON & RegistrationResponseJSON & {
    username?: string;
    password?: string;
    resetToken?: string;
    method: AuthMethodNames;
    [key: string]: any;
} & {
    transports?: string;
};
type DbAuthSession<T = unknown> = Record<string, T>;
type CorsHeaders = Record<string, string>;
export declare class DbAuthHandler<TUser extends UserType, TUserAttributes = Record<string, unknown>> {
    event: Request | APIGatewayProxyEvent;
    _normalizedRequest: PartialRequest<Params> | undefined;
    httpMethod: string;
    options: DbAuthHandlerOptions<TUser, TUserAttributes>;
    cookie: string;
    db: PrismaClient;
    dbAccessor: any;
    dbCredentialAccessor: any;
    allowedUserFields: string[];
    hasInvalidSession: boolean;
    session: DbAuthSession | undefined;
    sessionCsrfToken: string | undefined;
    corsContext: CorsContext | undefined;
    sessionExpiresDate: string;
    webAuthnExpiresDate: string;
    encryptedSession: string | null;
    createResponse: (response: {
        body?: string;
        statusCode: number;
        headers?: Headers;
    }, corsHeaders: CorsHeaders) => {
        headers: Record<string, string | string[]>;
        body?: string | undefined;
        statusCode: number;
    };
    get normalizedRequest(): PartialRequest<Params>;
    static get METHODS(): AuthMethodNames[];
    static get VERBS(): {
        forgotPassword: string;
        getToken: string;
        login: string;
        logout: string;
        resetPassword: string;
        signup: string;
        validateResetToken: string;
        webAuthnRegOptions: string;
        webAuthnRegister: string;
        webAuthnAuthOptions: string;
        webAuthnAuthenticate: string;
    };
    static get PAST_EXPIRES_DATE(): string;
    static get CSRF_TOKEN(): string;
    static get AVAILABLE_WEBAUTHN_TRANSPORTS(): string[];
    /**
     * Returns the set-cookie header to mark the cookie as expired ("deletes" the session)
     *
     * The header keys are case insensitive, but Fastify prefers these to be lowercase.
     * Therefore, we want to ensure that the headers are always lowercase and unique
     * for compliance with HTTP/2.
     *
     * @see: https://www.rfc-editor.org/rfc/rfc7540#section-8.1.2
     */
    get _deleteSessionHeader(): Headers;
    constructor(event: APIGatewayProxyEvent | Request, _context: LambdaContext, // @TODO:
    options: DbAuthHandlerOptions<TUser, TUserAttributes>);
    init(): Promise<void>;
    invoke(): Promise<{
        headers: Record<string, string | string[]>;
        body?: string | undefined;
        statusCode: number;
    }>;
    forgotPassword(): Promise<AuthMethodOutput>;
    getToken(): Promise<AuthMethodOutput>;
    login(): Promise<AuthMethodOutput>;
    logout(): AuthMethodOutput;
    resetPassword(): Promise<AuthMethodOutput>;
    signup(): Promise<AuthMethodOutput>;
    validateResetToken(): Promise<AuthMethodOutput>;
    webAuthnAuthenticate(): Promise<AuthMethodOutput>;
    webAuthnAuthOptions(): Promise<AuthMethodOutput>;
    webAuthnRegOptions(): Promise<AuthMethodOutput>;
    webAuthnRegister(): Promise<AuthMethodOutput>;
    _validateOptions(): void;
    _saveChallenge(userId: string | number, value: string | null): Promise<void>;
    _webAuthnCookie(id: string, expires: string): string;
    _sanitizeUser(user: Record<string, unknown>): any;
    _decodeEvent(): void;
    _cookieAttributes({ expires, options, }: {
        expires?: 'now' | string;
        options?: DbAuthHandlerOptions['cookie'];
    }): (string | null)[];
    _createAuthProviderCookieString(): string;
    _createSessionCookieString<TIdType = any>(data: DbAuthSession<TIdType>, csrfToken: string): string;
    _validateCsrf(): Promise<boolean>;
    _findUserByToken(token: string): Promise<any>;
    _clearResetToken(user: Record<string, unknown>): Promise<void>;
    _verifyUser(username: string | undefined, password: string | undefined): Promise<any>;
    _verifyPassword(user: Record<string, unknown>, password: string): Promise<Record<string, unknown>>;
    _getCurrentUser(): Promise<any>;
    _createUser(): Promise<any>;
    _getAuthMethod(): Promise<AuthMethodNames>;
    _validateField(name: string, value: string | undefined): value is string;
    _loginResponse(user: Record<string, any>, statusCode?: number): [{
        id: string;
    }, Headers, {
        statusCode: number;
    }];
    _logoutResponse(response?: Record<string, unknown>): AuthMethodOutput;
    _ok(body: string | boolean | undefined | Record<string, unknown>, headers?: Headers, options?: {
        statusCode: number;
    }): {
        statusCode: number;
        body: string;
        headers: Headers;
    };
    _notFound(): {
        statusCode: number;
    };
    _badRequest(message: string): {
        statusCode: number;
        body: string;
        headers: Headers;
    };
    _getUserMatchCriteriaOptions(username: string, usernameMatchFlowOption: string | undefined): {
        [x: string]: string;
    } | {
        [x: string]: {
            equals: string;
            mode: string;
        };
    };
}
export {};
//# sourceMappingURL=DbAuthHandler.d.ts.map