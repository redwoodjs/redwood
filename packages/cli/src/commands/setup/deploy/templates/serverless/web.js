import path from 'path'

import { getPaths } from '../../../../../lib'

export const PROJECT_NAME = path.basename(getPaths().base)

export const SERVERLESS_WEB_YML = `# See the full yml reference at https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/
service: ${PROJECT_NAME}-web

# Uncomment org and app if you want to integrate your deployment with the
# Serverless dashboard, or run \`serverless\` to be prompted to connect.
# See https://www.serverless.com/framework/docs/dashboard/ for more details.
# org: your-org
# app: your-app

useDotenv: true

plugins:
  - serverless-lift

constructs:
  web:
    type: static-website
    path: dist

provider:
  name: aws
  runtime: nodejs14.x
  region: us-east-2
`
