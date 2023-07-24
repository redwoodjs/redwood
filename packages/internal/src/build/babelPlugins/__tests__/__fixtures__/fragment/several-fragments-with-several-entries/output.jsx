import { fragmentRegistry } from '@redwoodjs/web/apollo'
export const VoteButtons_Fragment_entry = gql`
  fragment VoteButtonsFragment on FeedEntry {
    score
    vote {
      choice
    }
  }
`
fragmentRegistry.register(VoteButtons_Fragment_entry)
export const VoteButtons_Fragment_voter = gql`
  fragment VoterFragment on FeedEntry {
    voter {
      id
      name
    }
  }
`
fragmentRegistry.register(VoteButtons_Fragment_voter)
export const AnotherVoteButtons_Fragment_entry = gql`
  fragment AnotherVoteButtonsFragment on FeedEntry {
    score
    vote {
      choice
    }
  }
`
fragmentRegistry.register(AnotherVoteButtons_Fragment_entry)
export const AnotherVoteButtons_Fragment_voter = gql`
  fragment AnotherVoterFragment on FeedEntry {
    voter {
      id
      name
    }
  }
`
fragmentRegistry.register(AnotherVoteButtons_Fragment_voter)
