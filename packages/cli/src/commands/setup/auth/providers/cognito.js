export const config = {
  imports: [`import { CognitoUserPool } from 'amazon-cognito-identity-js'`],
  init: `const cognitoClient = new CognitoUserPool({
    UserPoolId: process.env.COGNITO_USERPOOL_ID',
    ClientId: process.env.COGNITO_CLIENT_ID',
  })`,
  authProvider: {
    client: 'cognitoClient',
    type: 'cognito',
  },
}

export const webPackages = ['amazon-cognito-identity-js']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  'Please add the Cognito UserPoolId to your .env file',
  'Please add the Cognito ClientId to your .env file',
  'COGNITO_USERPOOL_ID',
  'COGNITO_CLIENT_ID',
]
