import React from 'react'

import { useQuery, gql } from '@apollo/client'

import { RedwoodGraphiQL } from '../Components/RedwoodGraphiQL/RedwoodGraphiQL'

const GET_AUTH = gql`
  query {
    webConfig {
      graphqlEndpoint
    }
    generateAuthHeaders {
      authProvider
      cookie
      authorization
    }
  }
`

const DEFAULT_QUERY = `{
  redwood {
    version
  }
}`

function GraphiQL() {
  const { data } = useQuery(GET_AUTH)
  let headers = undefined as undefined | Record<string, string>

  if (data && data.generateAuthHeaders) {
    const { authProvider, authorization, cookie } = data.generateAuthHeaders

    if (authProvider) {
      headers = {
        'auth-provider': authProvider,
        authorization: authorization,
      }

      if (cookie) {
        headers = {
          'auth-provider': authProvider,
          authorization: authorization,
          cookie,
        }
      }
    }

    if (headers) {
      console.debug('headers', headers)
      console.debug('headers JSON', JSON.stringify(headers))
      return (
        <RedwoodGraphiQL
          headers={JSON.stringify(headers)}
          endpoint="http://localhost:4318/proxies/graphql"
          defaultQuery={DEFAULT_QUERY}
        />
      )
    }

    return (
      <RedwoodGraphiQL
        endpoint="http://localhost:4318/proxies/graphql"
        defaultQuery={DEFAULT_QUERY}
      />
    )
  }

  return <div>Loading...</div>
}

export default GraphiQL
