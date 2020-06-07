import type { default as GoTrue, User as GoTrueUser } from 'gotrue-js'

import type { AuthClient } from './index'

export type { GoTrue, GoTrueUser }

export interface AuthClientGoTrue extends AuthClient {
  login(options: {
    email: string
    password: string
    remember?: boolean
  }): Promise<GoTrueUser>
  client: GoTrue
}

export const mapAuthClientGoTrue = (client: GoTrue): AuthClientGoTrue => {
  return {
    type: 'gotrue',
    client,
    login: async ({ email, password, remember }) =>
      client.login(email, password, remember),
    logout: async () => {
      const user = await client.currentUser()
      return user?.logout()
    },
    getToken: async () => {
      const user = await client.currentUser()
      return user?.jwt() || null
    },
    currentUser: async () => client.currentUser(),
  }
}
