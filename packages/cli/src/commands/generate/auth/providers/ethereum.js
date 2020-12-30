// the lines that need to be added to index.js
export const config = {
  imports: [
    `import EthereumAuthClient from '@oneclickdapp/ethereum-auth'`,
    `import { ApolloClient, InMemoryCache } from '@apollo/client'`,
  ],
  init: `const ApolloInjector = ({ children }) => {
  let ethereum
  try {
    const graphQLClient = new ApolloClient({
      cache: new InMemoryCache(),
      uri: \`\${window.__REDWOOD__API_PROXY_PATH}/graphql\`,
    })
    const makeRequest = graphQLClient.mutate
    ethereum = new EthereumAuthClient({
      makeRequest,
      debug: process.NODE_ENV !== 'production',
    })
  } catch (e) {
    console.log(e)
  }
  return React.cloneElement(children, { client: ethereum })
}`,
  authProvider: {
    client: 'ethereum',
    type: 'ethereum',
    render: 'ApolloInjector',
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
