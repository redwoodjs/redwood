export const schema = gql`
  type TextComment implements Comment {
    id: Int!
    author: String
    body: String!
  }

  type Query {
    textComments: [TextComment!]! @skipAuth
  }

  input CreateTextCommentInput {
    author: String
    body: String!
  }

  input UpdateTextCommentInput {
    author: String
    body: String
  }
`
