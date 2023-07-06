import gql from 'graphql-tag'

export const schema = gql`
  type Subscription {
    countdown(from: Int!, interval: Int!): Int! @requireAuth
  }
`

/**
 * To test this Countdown subscription, run the following in the GraphQL Playground:
 *
 * subscription CountdownFromInterval {
 *   countdown(from: 100, interval: 10)
 * }
 */
const countdown = {
  countdown: {
    async *subscribe(_, { from = 100, interval = 10 }) {
      while (from >= 0) {
        yield { countdown: from }
        // pause for 1/4 second
        await new Promise((resolve) => setTimeout(resolve, 250))
        from -= interval
      }
    },
  },
}

export default countdown
