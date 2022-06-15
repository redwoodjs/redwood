import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUserSession,
  ICognitoUserData
} from 'amazon-cognito-identity-js'

import { AuthClient } from './index'

export type { CognitoUserPool }
export type { CognitoUser }
interface CognitoCredentials {
  username: string
  password: string
}
interface ChangePasswordProps {
  oldPassword: string
  newPassword: string
}
export type Cognito = CognitoUserPool
export type CognitoUserData = ICognitoUserData
export interface CognitoAuthClient extends AuthClient {
  login: (options: {
    username: string
    password: string
  }) => Promise<CognitoUserSession>
}

export const cognito = (client: CognitoUserPool): CognitoAuthClient => {
  return {
    client,
    type: 'cognito',
    login: ({ username, password }) => {
      return new Promise((resolve, reject) => {
        const authenticationData = {
          Username: username,
          Password: password,
        }
        const authenticationDetails = new AuthenticationDetails(
          authenticationData
        )
        const cognitoUser = new CognitoUser({
          Username: username,
          Pool: client,
        })

        cognitoUser?.authenticateUser(authenticationDetails, {
          onSuccess: (session) => {
            resolve(session)
          },
          onFailure: (err: any) => {
            reject(err)
          }
        })
      })
    },
    logout: (): void => {
      client.getCurrentUser()?.signOut()
    },
    signup: ({ username, password }: CognitoCredentials) => {
      return new Promise(function (resolve, reject) {
        const attributeList = [
          new CognitoUserAttribute({
            Name: 'username',
            Value: username,
          }),
        ]

        client.signUp(username, password, attributeList, [], function (err, res) {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        })
      }).catch((err) => {
        throw err
      })
    },
    getToken: (): Promise<string | null> => {
      return new Promise<string>((resolve, reject) => {
        const user = client.getCurrentUser()
        user?.getSession((err: Error | null, session: CognitoUserSession) => {
          if (err) {
            reject(err)
          } else {
            const jwtToken = session.getAccessToken().getJwtToken()
            resolve(jwtToken)
          }
        })
      }).catch((err) => {
        throw err
      })
    },
    getUserMetadata: () => {
      return new Promise<CognitoUser | null>((resolve) => {
        const currentUser = client.getCurrentUser()
        console.error({ currentUser })
        resolve(currentUser)
      }).catch((err) => {
        throw err
      })
    },
    forgotPassword: (email: string) => {
      return new Promise((resolve, reject) => {
        const user = new CognitoUser({
          Username: email,
          Pool: client,
        })
        user.forgotPassword({
          onSuccess: (result: any) => {
            resolve(result)
          },
          onFailure: (err: Error) => {
            console.error(
              `Error getting validation token for user ${email}. ${err.message}`
            )
            reject(err)
          },
        })
      })
    },
    resetPassword: ({ oldPassword, newPassword }: ChangePasswordProps) => {
      return new Promise((resolve, reject) => {
        const user = client.getCurrentUser()
        if (user) {
          user.changePassword(oldPassword, newPassword, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        }
      })
    },
  }
}
