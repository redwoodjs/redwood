import path from 'path'

import { getPaths } from '../../../../lib'

export const PROJECT_NAME = path.basename(getPaths().base)

export const COHERENCE_YAML = (database) => {
  return `
api:
  type: backend
  url_path: "/api"
  prod:
    command: ["yarn", "rw", "build", "api", "&&", "yarn", "rw", "serve", "api"]
  dev:
    command: ["yarn", "rw", "build", "api", "&&", "yarn", "rw", "dev", "api"]
  local_packages: ["node_modules"]

  system:
    cpu: 2
    memory: 2G
    health_check: "/health"

  ${database}

web:
  type: frontend
  assets_path: "web/dist"
  prod:
    command: ["yarn", "rw", "serve", "web"]
  dev:
    command: ["yarn", "rw", "dev", "web", "--fwd=\\"--allowed-hosts all\\""]
  build: ["yarn", "rw", "build", "web"]
  local_packages: ["node_modules"]

  system:
    cpu: 2
    memory: 2G
`
}

export const DATABASE_YAML = (detectedDatabase) => `
  resources:
  - name: ${PROJECT_NAME}-db
    engine: ${detectedDatabase}
    version: 13
    type: database
`

export const COHERENCE_HEALTH_CHECK = `// coherence-health-check
export const handler = async () => {
  return {
    statusCode: 200,
  }
}`
