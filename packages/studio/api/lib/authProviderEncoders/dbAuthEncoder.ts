import { v4 as uuidv4 } from 'uuid'

import { SESSION_SECRET } from '../envars'

const isNumeric = (id: string) => {
  return /^\d+$/.test(id)
}

export const getDBAuthHeader = async (userId?: string) => {
  if (!userId) {
    throw new Error('Require an unique id to generate session cookie')
  }

  if (!SESSION_SECRET) {
    throw new Error(
      'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
    )
  }

  const {
    default: { encryptSession },
  } = await import('@redwoodjs/auth-dbauth-api')

  const id = isNumeric(userId) ? parseInt(userId) : userId
  const cookie = encryptSession(JSON.stringify({ id }) + ';' + uuidv4())

  return {
    authProvider: 'dbAuth',
    cookie: `session=${cookie}`,
    authorization: `Bearer ${userId}`,
  }
}
