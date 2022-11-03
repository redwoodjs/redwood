export const schema = gql`
  interface Comment {
    id: Int!
    author: String
  }

  type Query {
    comments: [Comment!]! @skipAuth
  }

  input CreateCommentInput {
    author: String
  }

  input UpdateCommentInput {
    author: String
  }
`
