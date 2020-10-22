import type { default as GoTrue } from 'gotrue-js'
import type { User } from 'gotrue-js'

export type GoTrueUser = User
export type { GoTrue }

export function goTrue(client: GoTrue) {
  return {
    type: 'goTrue',
    client,
    login: client.login,
    logout: () => client.currentUser()?.logout(),
    signup: client.signup,
    getToken: () => client.currentUser()?.jwt(),
    getUserMetadata: () => client.currentUser(),
  }
}
