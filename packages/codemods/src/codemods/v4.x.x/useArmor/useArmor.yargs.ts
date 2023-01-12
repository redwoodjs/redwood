import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import isTSProject from '../../../lib/isTSProject'
import runTransform from '../../../lib/runTransform'

export const command = 'use-armor'
export const description =
  '(v4.x.x->v4.x.x) Updates createGraphQLHandler config to use GraphQL Armor config as needed'

export const handler = () => {
  task('Use Armor', async ({ setOutput }) => {
    const graphqlHandlerFile = isTSProject ? 'graphql.ts' : 'graphql.js'
    await runTransform({
      transformPath: path.join(__dirname, 'useArmor.js'),
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
      'Updating createGraphQLHandler for useArmor config is done! Run `yarn rw lint --fix` to prettify your code'
    )
  })
}
