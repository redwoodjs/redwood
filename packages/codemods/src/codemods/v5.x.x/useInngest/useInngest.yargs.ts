import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import isTSProject from '../../../lib/isTSProject'
import runTransform from '../../../lib/runTransform'

export const command = 'use-armor'
export const description =
  '(v5.x.x->v5.x.x) Updates createGraphQLHandler config to use the Inngest GraphQL plugin'

export const handler = () => {
  task('Use Armor', async ({ setOutput }) => {
    const graphqlHandlerFile = isTSProject ? 'graphql.ts' : 'graphql.js'
    await runTransform({
      transformPath: path.join(__dirname, 'useInngest.js'),
      targetPaths: [
        path.join(
          getRWPaths().api.base,
          'src',
          'functions',
          graphqlHandlerFile
        ),
      ],
    })

    setOutput(
      'Updating createGraphQLHandler to setup useInngest is done! Run `yarn rw lint --fix` to prettify your code'
    )
  })
}
