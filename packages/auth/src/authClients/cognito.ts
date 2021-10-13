import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

import { AuthClient, SupportedUserMetadata } from './index'

export type { CognitoUserPool }
export type { CognitoUser }

const getCognitoUser = (username: string) => {
  const userPoolId = process.env.COGNITO_USERPOOL_ID || ''
  const clientId = process.env.COGNITO_CLIENT_ID || ''

  const userPool = new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
  })

  if (!userPool) {
    const userData = {
      Username: username,
      Pool: userPool,
    }
    const cognitoUser = new CognitoUser(userData)

    return cognitoUser
  }
  return null
}

export type CognitoAuthClient = AuthClient

export const cognito = (client: CognitoUserPool): CognitoAuthClient => {
  const poolData = {
    UserPoolId: process.env?.COGNITO_USERPOOL_ID || '',
    ClientId: process.env?.COGNITO_CLIENT_ID || '',
  }
  const userPool: CognitoUserPool = new CognitoUserPool(poolData)
  return {
    client: client,
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
        const cognitoUser = getCognitoUser(username)

        cognitoUser?.authenticateUser(authenticationDetails, {
          onSuccess: (result: CognitoUserSession) => {
            resolve(result)
          },
          onFailure: (err: any) => {
            reject(err)
          },
        })
      })
    },
    logout: ({ user }) => {
      user.signOut()
    },
    signup: ({ username, password }) => {
      return new Promise(function (resolve, reject) {
        const attributeList = [
          new CognitoUserAttribute({
            Name: 'email',
            Value: username,
          }),
        ]

        userPool.signUp(
          username,
          password,
          attributeList,
          [],
          function (err, res) {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          }
        )
      }).catch((err) => {
        throw err
      })
    },
    getToken: ({ user }) => {
      return new Promise<string>((resolve, reject) => {
        const token = user
          .getSignInUserSession()
          ?.getAccessToken()
          ?.getJwtToken()
        if (token) {
          resolve(token as string)
        }
        reject()
      }).catch((err) => {
        throw err
      })
    },
    getUserMetadata: ({ user }) => {
      return new Promise<SupportedUserMetadata>((resolve, reject) => {
        const userAttributes = user.getUserAttributes()

        if (!userAttributes) {
          reject()
        }
        resolve(userAttributes)
      }).catch((err) => {
        throw err
      })
    },
  }
}
