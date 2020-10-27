import * as FB from 'fb-sdk-wrapper'
import { AuthClient } from '../'

export type Facebook = typeof FB
export interface FacebookUser {
  name: string
  id: string
}

export interface AuthClientFacebook extends AuthClient {
  login(options?: facebook.LoginOptions): Promise<facebook.StatusResponse>
  logout(): Promise<facebook.StatusResponse>
  signup(options?: facebook.LoginOptions): Promise<facebook.StatusResponse>
  getToken(force?: boolean): Promise<null | string>
  getUserMetadata(): Promise<null | FacebookUser>
}

export const facebook = (client: Facebook): AuthClientFacebook => {
  return {
    type: 'facebook',
    client,

    async login(options?) {
      return await client.login(options)
    },

    async logout() {
      return await client.logout()
    },

    async signup(options?) {
      return await this.login(options)
    },

    async getToken(force = false) {
      const statusResponse = await client.getLoginStatus(force)
      if (statusResponse.status === 'connected') {
        return statusResponse.authResponse.accessToken
      } else {
        return null
      }
    },

    /** The user's data from the AuthProvider */
    async getUserMetadata() {
      const statusResponse = await client.getLoginStatus()
      if (statusResponse.status === 'connected') {
        return await client.api('/me')
      } else {
        return null
      }
    },
  }
}
