import path from 'path'

import { getPaths } from 'src/lib'

const NETLIFY_TOML = `[build]
command = "yarn rw build && yarn rw db up --no-db-client --auto-approve && yarn rw dataMigrate up"
publish = "web/dist"
functions = "api/dist/functions"

[dev]
  command = "yarn rw dev"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`

// any files to create
export const files = [
  { path: path.join(getPaths().base, 'netlify.toml'), content: NETLIFY_TOML },
]

export const apiProxyPath = '/.netlify/functions'

// any notes to print out when the job is done
export const notes = [
  'You are ready to deploy to Netlify!',
  'See: https://redwoodjs.com/docs/deploy#netlify-deploy',
]
