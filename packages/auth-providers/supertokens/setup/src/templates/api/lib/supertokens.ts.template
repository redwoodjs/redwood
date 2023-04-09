import * as Session from 'supertokens-node/recipe/session'
import ThirdPartyEmailPassword, {
  Google,
  Github,
  Apple,
} from 'supertokens-node/recipe/thirdpartyemailpassword'
import type { TypeInput } from 'supertokens-node/types'

const websiteDomain =
  process.env.SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:8910'
const apiDomain = process.env.SUPERTOKENS_API_DOMAIN || websiteDomain
const apiGatewayPath = process.env.SUPERTOKENS_API_GATEWAY_PATH || '/.redwood/functions'

const jwksIssuerUrl = {}

export const config: TypeInput = {
  framework: 'awsLambda',
  isInServerlessEnv: true,
  appInfo: {
    appName: 'SuperTokens RedwoodJS',
    apiDomain,
    websiteDomain,
    apiGatewayPath,
    websiteBasePath: '/auth',
    apiBasePath: '/auth',
  },
  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CONNECTION_URI,
  },
  recipeList: [
    ThirdPartyEmailPassword.init({
      providers: [
        Google({
          clientId: process.env.SUPERTOKENS_GOOGLE_CLIENT_ID,
          clientSecret: process.env.SUPERTOKENS_GOOGLE_CLIENT_SECRET,
        }),
        Github({
          clientId: process.env.SUPERTOKENS_GITHUB_CLIENT_ID,
          clientSecret: process.env.SUPERTOKENS_GITHUB_CLIENT_SECRET,
        }),
        Apple({
          clientId: process.env.SUPERTOKENS_APPLE_CLIENT_ID,
          clientSecret: {
            keyId: process.env.SUPERTOKENS_APPLE_SECRET_KEY_ID,
            privateKey: process.env.SUPERTOKENS_APPLE_SECRET_PRIVATE_KEY,
            teamId: process.env.SUPERTOKENS_APPLE_SECRET_TEAM_ID,
          },
        }),
      ],
    }),
    Session.init({
      jwt: { enable: true, ...jwksIssuerUrl },
    }),
  ],
}
