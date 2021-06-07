import path from 'path'

import { getPaths } from 'src/lib'

export const apiProxyPath = '/api'

const VERCEL_CONFIG = {
  // spa-redirect, if you prerender, vercel knows to use filesystem first
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
  cleanUrls: true,
  trailingSlash: false,
}

// any files to create
export const files = [
  {
    path: path.join(getPaths().base, 'vercel.json'),
    content: JSON.stringify(VERCEL_CONFIG, undefined, 2), // format it neatly
  },
]

// any notes to print out when the job is done
export const notes = [
  'You are ready to deploy to Vercel!',
  'See: https://redwoodjs.com/docs/deploy#vercel-deploy',
]
