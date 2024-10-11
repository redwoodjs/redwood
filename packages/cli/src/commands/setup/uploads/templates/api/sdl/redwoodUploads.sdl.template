export const schema = gql`
  scalar File

  type RedwoodUploadToken {
    token: String!
  }

  type Query {
    getRedwoodUploadToken(operationName: String!): RedwoodUploadToken! @skipAuth
  }
`
