import { gql } from '../../../main'

export const schema = gql`
  type Blog {
    id: ID!
    title: String
  }

  type Query {
    blog: Blog
    blogs: [Blog]
    notfound: Boolean
  }
`

export const resolvers = {
  Query: {
    blogs: () => [
      { id: 1, title: 'blog post 1' },
      { id: 2, title: 'blog post 2' },
    ],
  },
}
