import type {
  Magic,
  MagicUserMetadata,
  LoginWithMagicLinkConfiguration,
} from 'magic-sdk'

export type MagicLink = Magic
export type MagicUser = MagicUserMetadata

export const magicLink = (client: MagicLink) => {
  return {
    type: 'magicLink',
    client,
    login: ({ email, showUI }: LoginWithMagicLinkConfiguration) =>
      client.auth.loginWithMagicLink({ email, showUI }),
    logout: () => client.user.logout().then(),
    signup: ({ email, showUI }: LoginWithMagicLinkConfiguration) =>
      client.auth.loginWithMagicLink({ email, showUI }),
    getToken: () => client.user.getIdToken(),
    getUserMetadata: async () =>
      (await client.user.isLoggedIn()) ? await client.user.getMetadata() : null,
  } as const
}
