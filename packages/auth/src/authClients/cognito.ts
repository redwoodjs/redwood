import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  IAuthenticationDetailsData,
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

type CognitoLogoutOptions = {
  username: string
  callback?: () => void
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
    login: async (options: IAuthenticationDetailsData) => {
      return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails(options)

        const user = getCognitoUser(options.Username, client)

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
    logout: async (options: CognitoLogoutOptions) => {
      const { username, callback } = options

      getCognitoUser(username, client).signOut(callback)
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
  }
}
