import fs from 'fs'
import path from 'path'

import CryptoJS from 'crypto-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

import { getPaths } from '@redwoodjs/internal'

const isNumeric = (id: string) => {
  return /^\d+$/.test(parseInt(id).toString())
}

export const getDBAuthHeader = (userId: string) => {
  if (!userId) {
    throw new Error('Require an unique id to generate session cookie')
  }

  const basePath = getPaths().base
  const envPath = path.join(basePath, '.env')
  const envFile = fs.readFileSync(envPath, 'utf8')
  const buf = Buffer.from(envFile)

  const appEnv = dotenv.parse(buf)

  const sessionSecret = appEnv.SESSION_SECRET

  if (!sessionSecret) {
    throw new Error(
      'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
    )
  }

  const id = isNumeric(userId) ? parseInt(userId) : userId

  const cookie = CryptoJS.AES.encrypt(
    JSON.stringify({ id }) + ';' + uuidv4(),
    sessionSecret
  ).toString()

  return {
    authProvider: 'dbAuth',
    cookie: `session=${cookie}`,
    authorization: `Bearer ${id}`,
  }
}
