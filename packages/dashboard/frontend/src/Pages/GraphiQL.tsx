import React from 'react'

import { useQuery, gql } from '@apollo/client'

import { RedwoodGraphiQL } from '../Components/RedwoodGraphiQL/RedwoodGraphiQL'

const GET_AUTH = gql`
  query {
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

  console.log(data?.generateAuthHeaders)

  if (data) {
    headers = `{"auth-provider": "${data?.generateAuthHeaders.authProvider}", "cookie": "${data?.generateAuthHeaders.cookie}", "authorization": "${data?.generateAuthHeaders.authorization}"}`
  }

  console.log(data)
  return <RedwoodGraphiQL headers={headers} />
}

export default GraphiQL
