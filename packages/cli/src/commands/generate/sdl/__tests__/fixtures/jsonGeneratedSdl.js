export const schema = gql`
  type Photo {
    id: Int!
    name: String!
    metadata: JSON!
  }

  type Query {
    photos: [Photo!]!
    photo(id: Int!): Photo!
  }

  input CreatePhotoInput {
    name: String!
    metadata: JSON!
  }

  input UpdatePhotoInput {
    name: String
    metadata: JSON
  }

  type Mutation {
    createPhoto(input: CreatePhotoInput!): Photo!
    updatePhoto(id: Int!, input: UpdatePhotoInput!): Photo!
    deletePhoto(id: Int!): Photo!
  }
`
