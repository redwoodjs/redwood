import fs from 'fs'
import path from 'path'

import { getPaths } from 'src/lib'

const PROJECT_NAME = getPaths().base.match(/[^/|\\]+$/)[0]

const RENDER_YAML = (database) => {
  return `services:
- type: web
  name: ${PROJECT_NAME}-web
  env: static
  buildCommand: yarn rw deploy render web
  staticPublishPath: ./web/dist
  envVars:
  - key: NODE_VERSION
    value: 14
  routes:
  - type: rewrite
    source: /.redwood/functions/*
# replace destination api url after first deploy to Render
    destination: replace_me_with_api_url/*
  - type: rewrite
    source: /*
    destination: /index.html

- type: web
  name: ${PROJECT_NAME}-api
  env: node
  buildCommand: yarn rw deploy render api
  startCommand: yarn rw serve api
  envVars:
  - key: NODE_VERSION
    value: 14
${database}
`
}

const POSTGRES_YAML = `  - key: DATABASE_URL
    fromDatabase:
      name: ${PROJECT_NAME}-db
      property: connectionString

databases:
  - name: ${PROJECT_NAME}-db
`

const SQLITE_YAML = `  - key: DATABASE_URL
    value: file:./data/sqlite.db
  disk:
    name: sqlite-data
    mountPath: /opt/render/project/src/api/db/data
    sizeGB: 1`

const RENDER_HEALTH_CHECK = `// render-health-check
export const handler = async () => {
  return {
    statusCode: 200,
  }
}
`
// prisma data source check
export const prismaDataSourceCheck = (database) => {
  if (database === 'none') {
    return {
      path: path.join(getPaths().base, 'render.yaml'),
      content: RENDER_YAML(''),
    }
  }
  const content = fs.readFileSync(getPaths().api.dbSchema).toString()
  const detectedDatabase = content.match(
    /(?<=datasource DS.*\n\W*provider\W*)\w+/
  )
  if (detectedDatabase == database) {
    switch (database) {
      case 'postgres':
        return {
          path: path.join(getPaths().base, 'render.yaml'),
          content: RENDER_YAML(POSTGRES_YAML),
        }
      case 'sqlite':
        return {
          path: path.join(getPaths().base, 'render.yaml'),
          content: RENDER_YAML(SQLITE_YAML),
        }
      default:
        throw new Error(`
       Unexpected datasource provider found: ${database}`)
    }
  } else {
    throw new Error(`
    Prisma datasource provider is detected to be ${detectedDatabase}.

    Option 1: Update your schema.prisma provider to be ${database}, then run
    yarn rw prisma migrate dev
    yarn rw setup deploy render --database ${database}

    Option 2: Rerun setup deloy command with current schema.prisma provider:
    yarn rw setup deploy render --database ${detectedDatabase}`)
  }
}

//any packages to install
export const apiPackages = ['@redwoodjs/api-server']

// any files to create
export const files = [
  {
    path: path.join(getPaths().base, 'api/src/functions/healthz.js'),
    content: RENDER_HEALTH_CHECK,
  },
]

export const apiProxyPath = '/.redwood/functions'

// any notes to print out when the job is done
export const notes = [
  'You are ready to deploy to Render!',
  'Check out the docs at https://render.com/docs/deploy-redwood to get started\n',
  'Note: After first deployment to Render update rewrite rule destiation in render.yaml',
]
