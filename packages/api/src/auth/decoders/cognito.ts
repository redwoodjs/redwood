import { decode } from 'jsonwebtoken'

export const cognito = async (token: any) => {
  const user = decode(token, { json: true })
  let roles = []

  //Extract roles from user groups
  if (user) {
    roles = user['cognito:groups']
  }

  return {
    ...user,
    roles,
  }
}
