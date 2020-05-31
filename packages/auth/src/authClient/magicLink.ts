import type { Magic, MagicUserMetadata } from 'magic-sdk'

export type MagicLink = Magic
export type MagicUser = MagicUserMetadata

import type { AuthClient } from './'

export interface AuthClientMagicLink extends AuthClient {
  login(options: { email: string; showUI?: boolean })
}

export const mapAuthClientMagicLink = (
  client: MagicLink
): AuthClientMagicLink => {
  return {
    type: 'magic.link',
    client,
    login: async ({ email, showUI }) =>
      await client.auth.loginWithMagicLink({ email: email, showUI: showUI }),
    logout: async () => {
      await client.user.logout()
    },
    getToken: async () => await client.user.getIdToken(),
    currentUser: async () =>
      (await client.user.isLoggedIn()) ? await client.user.getMetadata() : null,
  }
}
