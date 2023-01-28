import fs from 'fs'
import path from 'path'

import { getPaths, standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

// exported for testing
export const extraTask = {
  title: `Adding SuperTokens routing component to Routes.{js,tsx}...`,
  task: () => {
    const webRoutesPath = getPaths().web.routes

    let content = fs.readFileSync(webRoutesPath).toString()

    if (!/^\sif \(SuperTokens.canHandleRoute\(\)\) \{/.test(content)) {
      content = "import SuperTokens from 'supertokens-auth-react'\n\n" + content
      content = content.replace(
        /const Routes = \(\) => \{\n/,
        'const Routes = () => {\n' +
          '  if (SuperTokens.canHandleRoute()) {\n' +
          '    return SuperTokens.getRoutingComponent()\n' +
          '  }\n\n'
      )

      fs.writeFileSync(webRoutesPath, content)
    }
  },
}

export async function handler({ force: forceArg }: Args) {
  const { version } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
  )

  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'supertokens',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-supertokens-api'",
    apiPackages: [
      `@redwoodjs/auth-supertokens-api@${version}`,
      'supertokens-node@^12',
    ],
    webPackages: [
      `@redwoodjs/auth-supertokens-web@${version}`,
      'supertokens-auth-react@^0.30',
      'supertokens-web-js@^0.4',
    ],
    extraTask,
    notes: [
      "We've implemented some of SuperToken's recipes, but feel free",
      'to switch to something that better fits your needs. See https://supertokens.com/docs/guides.',
    ],
  })
}
