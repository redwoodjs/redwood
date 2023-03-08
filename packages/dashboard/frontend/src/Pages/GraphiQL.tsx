import React from 'react'

import { useQuery, gql } from '@apollo/client'

import { RedwoodGraphiQL } from '../Components/RedwoodGraphiQL/RedwoodGraphiQL'

const GET_AUTH = gql`
  query {
    generateAuthHeaders(userId: "1") {
      authProvider
      authorization
    }
  }
`

function GraphiQL() {
  const { data } = useQuery(GET_AUTH)
  let headers = ''

  if (data) {
    headers = `{"auth-provider-test": "${data?.generateAuthHeaders.authProvider}", "authorization": "${data?.generateAuthHeaders.authorization}"}`
  }

  console.log(data)
  return <RedwoodGraphiQL headers={headers} />
}

export default GraphiQL
