import gql from 'graphql-tag'

export const schema = gql`
  type Post {
    id: Int!
    title: String!
    slug: String!
    author: String!
    body: String!
    image: String
    postedAt: DateTime
  }

  type Query {
    posts: [Post!]!
    post(id: Int!): Post!
  }

  input CreatePostInput {
    title: String!
    slug: String!
    author: String!
    body: String!
    image: String
    postedAt: DateTime
  }

  input UpdatePostInput {
    title: String
    slug: String
    author: String
    body: String
    image: String
    postedAt: DateTime
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: Int!, input: UpdatePostInput!): Post!
    deletePost(id: Int!): Post!
  }
`
