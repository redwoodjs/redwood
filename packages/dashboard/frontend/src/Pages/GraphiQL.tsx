import React from 'react'

import { useQuery, gql } from '@apollo/client'

import { RedwoodGraphiQL } from '../Components/RedwoodGraphiQL/RedwoodGraphiQL'

// TODO: How to set the userId? Form? Query param? Toml config?
const GET_AUTH = gql`
  query {
    webConfig {
      graphqlEndpoint
    }
    generateAuthHeaders(userId: "1") {
      authProvider
      cookie
      authorization
    }
  }
`

function GraphiQL() {
  const { data } = useQuery(GET_AUTH)
  let headers = {} as Record<string, string>

  if (data) {
    const authProvider = data?.generateAuthHeaders.authProvider
    const authorization = data?.generateAuthHeaders.authorization
    const cookie = data?.generateAuthHeaders.cookie

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

    return (
      <RedwoodGraphiQL
        headers={headers.toString()}
        endpoint={data?.webConfig?.graphqlEndpoint}
      />
    )
  }
}

export default GraphiQL
