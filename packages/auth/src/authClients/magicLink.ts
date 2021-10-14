import { OAuthRedirectConfiguration } from '@magic-ext/oauth'
import type { Magic, MagicUserMetadata } from 'magic-sdk'

import type { AuthClient } from './'

export type MagicLink = Magic
export type MagicUser = MagicUserMetadata
export interface AuthClientMagicLink extends AuthClient {
  login(options: LoginProps): Promise<any>
  signup(options: LoginProps): Promise<any>
}

type SocialProps = { type: 'social' } & OAuthRedirectConfiguration

type WebAuthnProps =
  | {
      type: 'webauthn'
      authType: 'login'
      username: string
    }
  | {
      type: 'webauthn'
      authType: 'signup'
      username: string
      nickname: string
    }

type LoginProps =
  | { type: 'email'; email: string; showUI?: boolean }
  | { type: 'phoneNumber'; phoneNumber: string }
  | SocialProps
  | WebAuthnProps

export const magicLink = (client: MagicLink): AuthClientMagicLink => {
  let token: string | null
  let expireTime = 0

  const authFlow = async (options: LoginProps) => {
    switch (options.type) {
      case 'email': {
        const { email, showUI } = options
        return await client.auth.loginWithMagicLink({ email, showUI })
      }
      case 'phoneNumber': {
        const { phoneNumber } = options
        return await client.auth.loginWithSMS({
          phoneNumber,
        })
      }
      case 'social': {
        const { provider, redirectURI, scope, loginHint } = options
        if (!client.oauth) {
          console.error(
            'please install the OAuth2 NPM Package https://magic.link/docs/login-methods/social-logins/oauth-implementation/web'
          )
        }
        //@ts-ignore
        return await client.oauth.loginWithRedirect({
          provider,
          redirectURI,
          scope,
          loginHint,
        })
      }
      case 'webauthn': {
        if (!client.oauth) {
          console.error(
            'please install the OAuth2 NPM Package https://magic.link/docs/login-methods/social-logins/oauth-implementation/web'
          )
        }
        switch (options.authType) {
          case 'login': {
            const { username } = options

            //@ts-ignore
            return await client.webauthn.login({
              username,
            })
          }
          case 'signup': {
            const { username, nickname } = options

            //@ts-ignore
            return await client.webauthn.registerNewUser({
              username,
              nickname,
            })
          }
        }
      }
      default:
        console.error(`please provide an "type"`)
        break
    }
  }

  return {
    type: 'magicLink',
    client,
    login: async (options) => await authFlow(options),
    logout: async () => {
      token = null
      expireTime = 0
      await client.user.logout()
    },
    signup: async (options) => await authFlow(options),
    getToken: async () => {
      if (!token || Date.now() <= expireTime) {
        expireTime = Date.now() + 600 // now + 10 min
        return (token = await client.user.getIdToken())
      } else {
        return token
      }
    },
    getUserMetadata: async () =>
      (await client.user.isLoggedIn()) ? await client.user.getMetadata() : null,
  }
}
