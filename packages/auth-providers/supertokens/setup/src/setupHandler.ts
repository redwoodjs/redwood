import fs from 'fs'
import path from 'path'

import { getPaths, standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

// exported for testing
export const extraTask = {
  title: `Adding SuperTokens routing component to Routes.{jsx,tsx}...`,
  task: () => {
    const webRoutesPath = getPaths().web.routes

    let content = fs.readFileSync(webRoutesPath).toString()

    if (!/\n\s*if \(SuperTokens.canHandleRoute\(\)\) \{/.test(content)) {
      let hasImportedSuperTokens = false

      content = content
        .split('\n')
        .reduce<string[]>((acc, line) => {
          // Add the SuperTokens import before the first import from @redwoodjs
          if (
            !hasImportedSuperTokens &&
            line.includes('import') &&
            line.includes('@redwoodjs')
          ) {
            acc.push("import SuperTokens from 'supertokens-auth-react'")
            acc.push('')

            hasImportedSuperTokens = true
          }

          acc.push(line)

          return acc
        }, [])
        .join('\n')
        .replace(
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
