import fs from 'fs'
import path from 'path'

import dotenv from 'dotenv'

import { getPaths } from '@redwoodjs/internal'

const getRedwoodAppEnvVars = () => {
  const basePath = getPaths().base
  const envPath = path.join(basePath, '.env')
  const envFile = fs.readFileSync(envPath, 'utf8')
  const buf = Buffer.from(envFile)

  return dotenv.parse(buf)
}

export const SESSION_SECRET = getRedwoodAppEnvVars().SESSION_SECRET
export const SUPABASE_JWT_SECRET = getRedwoodAppEnvVars().SUPABASE_JWT_SECRET
