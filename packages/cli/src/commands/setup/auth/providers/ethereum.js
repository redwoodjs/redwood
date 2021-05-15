// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [
    `import EthereumAuthClient from '@oneclickdapp/ethereum-auth'`,
    `import { ApolloClient, InMemoryCache } from '@apollo/client'`,
    `import { FetchConfigProvider, useFetchConfig } from '@redwoodjs/web'`,
  ],
  init: `let ethereum

  const ApolloInjector = ({ children }) => {
  const { uri, headers } = useFetchConfig()
  try {
    const graphQLClient = new ApolloClient({
      cache: new InMemoryCache(),
      uri,
      headers,
    })
    // Default option using Apollo Client
    const makeRequest = (mutation, variables) =>
      graphQLClient.mutate({
        mutation,
        variables,
      })

    // Alternative option using graphql-hooks
    // You'll also need to modify graphQLClient
    // const makeRequest = (query, variables) =>
    //   graphQLClient.request({
    //     query,
    //     variables,
    //   })

    ethereum = new EthereumAuthClient({
      makeRequest,
      debug: process.NODE_ENV === 'development',
    })
  } catch (e) {
    console.log(e)
  }
  return React.cloneElement(children, { client: ethereum })
}`,
  authProvider: {
    client: 'ethereum',
    type: 'ethereum',
    render: ['FetchConfigProvider', 'ApolloInjector'],
  },
}

// required packages to install
export const webPackages = ['@oneclickdapp/ethereum-auth', '@apollo/client']
export const apiPackages = ['ethereumjs-util', 'eth-sig-util', 'jsonwebtoken']

// any notes to print out when the job is done
export const notes = [
  'There are a couple more things you need to do!',
  'Please see the readme for instructions:',
  'https://github.com/oneclickdapp/ethereum-auth',
  'This is a FOSS community-maintained package.',
  'Help us make it better!',
]
