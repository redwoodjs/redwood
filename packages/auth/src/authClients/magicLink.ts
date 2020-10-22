import type { Magic, MagicUserMetadata } from 'magic-sdk'

export type MagicLink = Magic
export type MagicUser = MagicUserMetadata

export function magicLink(client: MagicLink) {
  return {
    client,
    login: client.auth.loginWithMagicLink,
    logout: client.user.logout,
    signup: client.auth.loginWithMagicLink,
    getToken: client.user.getIdToken,
    getUserMetadata: async () =>
      (await client.user.isLoggedIn()) ? await client.user.getMetadata() : null,
  }
}
