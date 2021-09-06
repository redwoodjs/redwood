export const schema = gql`
  type AuthChallengeResult {
    message: String!
  }

  type AuthVerifyResult {
    token: String!
  }

  input AuthChallengeInput {
    address: String!
    options: JSON
  }

  input AuthVerifyInput {
    signature: String!
    address: String!
    options: JSON
  }

  type Mutation {
    authChallenge(input: AuthChallengeInput!): AuthChallengeResult
    authVerify(input: AuthVerifyInput!): AuthVerifyResult
  }
`
