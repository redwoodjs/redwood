import fs from 'fs'
import path from 'path'

import { getPaths } from '../../../../../lib'

export const PROJECT_NAME = path.basename(getPaths().base)

export const SERVERLESS_API_YML = `# See the full yml reference at https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/
service: ${PROJECT_NAME}-api

# Uncomment org and app if you want to integrate your deployment with the
# Serverless dashboard, or run \`serverless\` to be prompted to connect.
# See https://www.serverless.com/framework/docs/dashboard/ for more details.
# org: your-org
# app: your-app

useDotenv: true

provider:
  name: aws
  runtime: nodejs14.x
  region: us-east-2 # This is the AWS region where the service will be deployed.
  httpApi: # HTTP API is used by default. To learn about the available options in API Gateway, see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html
    cors:
      allowedOrigins:
        - '*' # This is the default value. You can remove this line if you want to restrict the CORS to a specific origin.
      # allowCredentials: true # allowCrednetials should only be used when allowedOrigins doesn't include '*'
      allowedHeaders:
        - authorization
        - auth-provider
        - content-Type
        - X-Amz-Date
        - X-Api-Key
        - X-Amz-Security-Token
        - X-Amz-User-Agent
    payload: '1.0'
    useProviderTags: true # https://www.serverless.com/framework/docs/deprecations/#AWS_HTTP_API_USE_PROVIDER_TAGS
  stackTags:
    source: serverless
    name: Redwood Lambda API with HTTP API Gateway
  tags:
    name: Redwood Lambda API with HTTP API Gateway
  lambdaHashingVersion: 20201221 # https://www.serverless.com/framework/docs/deprecations/#LAMBDA_HASHING_VERSION_V2
  environment:
    # Add environment variables here, either in the form
    # VARIABLE_NAME: \${env:VARIABLE_NAME} for vars in your local environment, or
    # VARIABLE_NAME: \${param:VARIABLE_NAME} for vars from the Serverless dashboard

package:
  individually: true
  patterns:
    - "!node_modules/.prisma/client/libquery_engine-*"
    - "node_modules/.prisma/client/libquery_engine-rhel-*"
    - "!node_modules/prisma/libquery_engine-*"
    - "!node_modules/@prisma/engines/**"

${
  fs.existsSync(path.resolve(getPaths().api.functions))
    ? `functions:
  ${fs
    .readdirSync(path.resolve(getPaths().api.functions))
    .map((file) => {
      const basename = path.parse(file).name
      return `${basename}:
    description: ${basename} function deployed on AWS Lambda
    package:
      artifact: api/dist/zipball/${basename}.zip # This is the default location of the zip file generated during the deploy command.
    memorySize: 1024 # mb
    timeout: 25 # seconds (max: 29)
    tags: # Tags for this specific lambda function
      endpoint: /${basename}
    handler: ${basename}.handler
    events:
      - httpApi:
          path: /${basename}
          method: GET
      - httpApi:
          path: /${basename}
          method: POST
`
    })
    .join('  ')}`
    : ''
}
`
