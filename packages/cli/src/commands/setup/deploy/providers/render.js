import fs from 'fs'
import path from 'path'

import { getPaths } from 'src/lib'

const RENDER_YAML = `services:
- type: web
  name: redwood-api
  env: node
  plan: starter
  buildCommand: yarn && yarn rw prisma migrate deploy && yarn rw build api
  startCommand: cd api && yarn api-server --functions ./dist/functions
  envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: redwood-db
      property: connectionString

- type: web
  name: redwood-web
  env: static
  buildCommand: yarn && yarn rw build web
  staticPublishPath: ./web/dist
  envVars:
  - key: API_PROXY_HOST
    fromService:
      name: redwood-api
      type: web
      property: host
  routes:
  - type: rewrite
    source: /*
    destination: /index.html

databases:
- name: redwood-db
`
const RENDER_HEALTH_CHECK = `
export const handler = async () => {
  return {
    statusCode: 200,
  }
}
`
// any packages to install
export const apiPackages = ['@redwoodjs/api-server']

// any files to create
export const files = [
  { path: path.join(getPaths().base, 'render.yaml'), content: RENDER_YAML },
  {
    path: path.join(getPaths().base, 'api/src/functions/healthz.js'),
    content: RENDER_HEALTH_CHECK,
  },
]

// any edits to Prisma data source
export const prismaDataSourceEdit = () => {
  const content = fs.readFileSync(getPaths().api.dbSchema).toString()

  if (!content.includes('postgres')) {
    const result = content.replace(/provider =.*\n/, `provider = "postgres"\n`)

    fs.writeFileSync(getPaths().api.dbSchema, result)
  }
}

// any notes to print out when the job is done
export const notes = [
  'You are ready to deploy to Render!',
  'Deploy to Render: https://render.com/deploy',
]
