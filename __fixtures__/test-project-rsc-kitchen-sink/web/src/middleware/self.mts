import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import type {
  MiddlewareRequest,
  MiddlewareResponse,
} from '@redwoodjs/web/middleware'

const __filename = fileURLToPath(import.meta.url)

export async function middleware(
  req: MiddlewareRequest,
  mwResponse: MiddlewareResponse
) {
  console.log('self.mts Middleware')
  console.log('self.mts req.url:', req.url)

  const url = new URL(req.url)
  if (url.pathname !== '/self.mts') {
    return mwResponse
  }

  const selfTs = fs.readFileSync(__filename, 'utf8')

  mwResponse.body = selfTs

  return mwResponse
}
