import type { FirebaseApp } from 'firebase/app';
import type { CustomParameters, User } from 'firebase/auth';
import type FirebaseAuthNamespace from 'firebase/auth';
import type { CurrentUser } from '@redwoodjs/auth';
type FirebaseAuth = typeof FirebaseAuthNamespace;
export type oAuthProvider = 'google.com' | 'facebook.com' | 'github.com' | 'twitter.com' | 'microsoft.com' | 'apple.com';
export type anonymousProvider = 'anonymous';
export type customTokenProvider = 'customToken';
export type emailLinkProvider = 'emailLink';
interface Options {
    providerId?: anonymousProvider | customTokenProvider | emailLinkProvider | oAuthProvider;
    email?: string;
    emailLink?: string;
    customToken?: string;
    password?: string;
    scopes?: string[];
    customParameters?: CustomParameters;
}
export declare function createAuth(firebaseClient: FirebaseClient, customProviderHooks?: {
    useCurrentUser?: () => Promise<CurrentUser>;
    useHasRole?: (currentUser: CurrentUser | null) => (rolesToCheck: string | string[]) => boolean;
}): {
    AuthContext: import("react").Context<import("@redwoodjs/auth").AuthContextInterface<User, "google.com" | "facebook.com" | "github.com" | "twitter.com" | "microsoft.com" | "apple.com" | Options, FirebaseAuthNamespace.UserCredential | undefined, unknown, void, "google.com" | "facebook.com" | "github.com" | "twitter.com" | "microsoft.com" | "apple.com" | Options, FirebaseAuthNamespace.UserCredential | undefined, unknown, unknown, unknown, unknown, FirebaseAuthNamespace.Auth> | undefined>;
    AuthProvider: ({ children }: import("@redwoodjs/auth/dist/AuthProvider/AuthProvider").AuthProviderProps) => import("react").JSX.Element;
    useAuth: () => import("@redwoodjs/auth").AuthContextInterface<User, "google.com" | "facebook.com" | "github.com" | "twitter.com" | "microsoft.com" | "apple.com" | Options, FirebaseAuthNamespace.UserCredential | undefined, unknown, void, "google.com" | "facebook.com" | "github.com" | "twitter.com" | "microsoft.com" | "apple.com" | Options, FirebaseAuthNamespace.UserCredential | undefined, unknown, unknown, unknown, unknown, FirebaseAuthNamespace.Auth>;
};
export interface FirebaseClient {
    firebaseAuth: FirebaseAuth;
    firebaseApp?: FirebaseApp;
}
export {};
//# sourceMappingURL=firebase.d.ts.map