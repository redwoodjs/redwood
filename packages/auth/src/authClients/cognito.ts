import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  ICognitoUserData,
  CognitoUserAttribute,
  ISignUpResult,
  NodeCallback,
  ClientMetadata,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

import { AuthClient } from '.'

export type { CognitoUserPool, CognitoUser }

type CognitoSignupOptions = {
  username: string
  password: string
  userAttributes: CognitoUserAttribute[]
  validationData: CognitoUserAttribute[]
  callback: NodeCallback<Error, ISignUpResult>
  clientMetadata?: ClientMetadata
}

type CognitoLoginOptions = {
  username: string
  password: string
}

type CognitoLogoutOptions = {
  onSuccess?: () => void
}

function getCognitoUser(
  username: string,
  client: CognitoUserPool
): CognitoUser {
  const userData: ICognitoUserData = {
    Username: username,
    Pool: client,
  }
  return new CognitoUser(userData)
}

export const cognito = (client: CognitoUserPool): AuthClient => {
  return {
    type: 'cognito',
    client,
    login: async (options: CognitoLoginOptions) => {
      return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
          Username: options.username,
          Password: options.password,
        })

        const user = getCognitoUser(options.username, client)

        user.authenticateUser(authenticationDetails, {
          onSuccess: (result) => {
            resolve(result)
          },
          onFailure: (err) => {
            reject(err)
          },
        })
      })
    },
    logout: async (options?: CognitoLogoutOptions) => {
      const username = client.getCurrentUser()?.getUsername()

      if (username) {
        getCognitoUser(username, client).signOut(options?.onSuccess)
      }
    },
    signup: async (options: CognitoSignupOptions) => {
      client.signUp(
        options.username,
        options.password,
        options.userAttributes,
        options.validationData,
        options.callback
      )
    },
    getToken: async () => {
      return new Promise((resolve, reject) => {
        try {
          client
            .getCurrentUser()
            ?.getSession((err: any, session: CognitoUserSession) => {
              if (err) {
                reject(err)
              }

              resolve(session.getIdToken().getJwtToken())
            })
        } catch (error) {
          reject(error)
        }
      })
    },
    getUserMetadata: async () => {
      return Promise.resolve(client.getCurrentUser())
    },
    forgotPassword(username) {
      // TODO: Implement
      console.log(username)
    },
    resetPassword(options?) {
      // TODO: Implement
      console.log(options)
    },
  }
}
