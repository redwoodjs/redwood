export const schema = gql`
  type __TYPE_NAME__ {
    id: Int!
    name: String!
    email: String!
    phone: String!
    address: String!
    verified: Boolean!
    tags: [String!]!

    relation: Relation!

    typeName: String!
  }

  type Query {
    __QUERY_NAME__s: [__TYPE_NAME__!]! @skipAuth
    __QUERY_NAME__(id: Int!): __TYPE_NAME__ @skipAuth
  }

  input Create__TYPE_NAME__Input {
    name: String!
    email: String!
    phone: String!
    address: String!
    verified: Boolean!
    tags: [String!]!

    typeName: String!
  }

  input Update__TYPE_NAME__Input {
    name: String
    email: String
    phone: String
    address: String
    verified: Boolean
    tags: [String!]
  }

  type Mutation {
    create__TYPE_NAME__(input: Create__TYPE_NAME__Input!): __TYPE_NAME__!
      @skipAuth
    update__TYPE_NAME__(
      id: Int!
      input: Update__TYPE_NAME__Input!
    ): __TYPE_NAME__! @skipAuth
    delete__TYPE_NAME__(id: Int!): __TYPE_NAME__! @skipAuth
  }
`
