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
  let headers = ''

  if (data) {
    headers = `{"auth-provider": "${data?.generateAuthHeaders.authProvider}", "cookie": "${data?.generateAuthHeaders.cookie}", "authorization": "${data?.generateAuthHeaders.authorization}"}`

    return (
      <RedwoodGraphiQL
        headers={headers}
        endpoint={data?.webConfig?.graphqlEndpoint}
      />
    )
  }
  return <>Error</>
}

export default GraphiQL
