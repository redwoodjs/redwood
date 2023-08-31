import type { GraphiQLOptions } from './types'
// import { isDevEnv } from './util'

const DEFAULT_QUERY = `query Redwood {
  redwood {
    version
  }
}`

// TODO: Once Studio is not experimental, can remove these generateGraphiQLHeaders
const AUTH_HEADER = `{"x-auth-comment": "See documentation: https://redwoodjs.com/docs/cli-commands#setup-graphiql-headers on how to auto generate auth headers"}`

export const configureGraphiQLPlayground = ({
  allowGraphiQL,
  generateGraphiQLHeader,
}: GraphiQLOptions) => {
  const isDevEnv = process.env.NODE_ENV === 'development'

  const disableGraphiQL =
    isDevEnv && (allowGraphiQL ?? true) ? false : !allowGraphiQL

  return !disableGraphiQL
    ? {
        title: 'Redwood GraphQL Playground',
        headers: generateGraphiQLHeader
          ? generateGraphiQLHeader()
          : AUTH_HEADER,
        defaultQuery: DEFAULT_QUERY,
        headerEditorEnabled: true,
      }
    : false
}
