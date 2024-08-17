import type { Decoder } from '@redwoodjs/api';
/**
 * This takes an auth0 jwt and verifies it. It returns something like this:
 * ```js
 * {
 *   iss: 'https://<AUTH0_DOMAIN>/',
 *   sub: 'auth0|xxx',
 *   aud: [ 'api.billable', 'https://<AUTH0_DOMAIN>/userinfo' ],
 *   iat: 1588800141,
 *   exp: 1588886541,
 *   azp: 'QOsYIlHvCLqLzmfDU0Z3upFdu1znlkqK',
 *   scope: 'openid profile email'
 * }
 * ```
 *
 * You can use `sub` as a stable reference to your user, but if you want the email
 * address you can set a context object[^0] in rules[^1]:
 *
 * ^0: https://auth0.com/docs/rules/references/context-object
 * ^1: https://manage.auth0.com/#/rules/new
 *
 */
export declare const verifyAuth0Token: (bearerToken: string) => Promise<null | Record<string, unknown>>;
export declare const authDecoder: Decoder;
//# sourceMappingURL=decoder.d.ts.map