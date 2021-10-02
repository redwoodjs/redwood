import { AuthClient } from './index'

export const cognito = (client: AuthClient): AuthClient => {
  return {
    client: client.client,
    type: 'cognito',
    login: () => {
      console.log('login')
      return new Promise(() => null)
    },
    logout: () => {
      console.log('logout')
      return new Promise(() => null)
    },
    signup: () => {},
    getToken: () => new Promise(() => null),
    getUserMetadata: () => new Promise(() => null),
    restoreAuthState: () => new Promise(() => null),
  }
}
